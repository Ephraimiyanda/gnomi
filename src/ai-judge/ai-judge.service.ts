import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

/**
 * Strict interface for AI JSON output to ensure frontend consistency
 */
export interface AiEvaluation {
  winnerId: string;
  reasoning: string;
  fallaciesFound: Array<{
    speakerId: string;
    fallacy: string;
    explanation: string;
  }>;
  rhetoricalScores: { [userId: string]: number }; // 1-10 scale
}

@Injectable()
export class AiJudgeService {
  private readonly genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  private readonly logger = new Logger(AiJudgeService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async evaluateDebate(debateId: string): Promise<void> {
    try {
      // 1. Fetch full context
      const session = await this.prisma.debateSession.findUnique({
        where: { id: debateId },
        include: {
          rounds: { orderBy: { roundNumber: 'asc' } },
          topic: true,
        },
      });

      if (!session) throw new NotFoundException('Debate session not found');

      // 2. Format transcript for LLM context
      const transcript = session.rounds
        .map(
          (r) =>
            `[Speaker: ${r.speakerId}] Round ${r.roundNumber}: ${r.content}`,
        )
        .join('\n\n');

      const prompt = `
        You are an elite debate judge. Analyze this debate on the topic: "${session.topic.title}".
        
        PARTICIPANTS:
        - User A: ${session.user1Id}
        - User B: ${session.user2Id}

        TRANSCRIPT:
        ${transcript}

        TASK:
        1. Determine who argued more effectively based on logic and evidence.
        2. Identify specific logical fallacies (strawman, ad hominem, etc.).
        3. Score each participant on a scale of 1-10.
        
        OUTPUT RULES:
        - Use ONLY the Participant IDs provided above for "winnerId" and "speakerId".
        - Return a RAW JSON object. No markdown. No backticks.
      `;

      // 3. Call Gemini 1.5 Pro with JSON Mode
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await model.generateContent(prompt);
      const evaluation: AiEvaluation = JSON.parse(result.response.text());

      // 4. Persistence: Atomic update of status and report creation
      await this.prisma.$transaction([
        this.prisma.aIReport.create({
          data: {
            debateSessionId: debateId,
            winnerId: evaluation.winnerId,
            analysisJson: evaluation as any,
          },
        }),
        this.prisma.debateSession.update({
          where: { id: debateId },
          data: { status: 'FINISHED' },
        }),
      ]);

      this.logger.log(`AI Verdict rendered for session ${debateId}`);

      // 5. Emit Event for Real-time Broadcasting (Gateway listens to this)
      this.eventEmitter.emit('debate.completed', {
        debateId,
        evaluation,
      });
    } catch (error) {
      this.logger.error(
        `AI Judging Failed for session ${debateId}: ${error.message}`,
      );
      this.eventEmitter.emit('debate.error', {
        debateId,
        message: 'AI Judge failed',
      });
    }
  }

  @OnEvent('debate.ended')
  async handleDebateEnded(payload: { debateId: string }) {
    await this.evaluateDebate(payload.debateId);
  }
}
