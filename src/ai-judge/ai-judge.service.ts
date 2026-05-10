import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiJudgeService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  private logger = new Logger(AiJudgeService.name);

  constructor(private prisma: PrismaService) {}

  async evaluateDebate(debateId: string) {
    const session = await this.prisma.debateSession.findUnique({
      where: { id: debateId },
      include: { rounds: true, topic: true },
    });

    if (!session) return;

    const transcript = session.rounds
      .map((r) => `User ${r.speakerId}: ${r.content}`)
      .join('\n');
    const prompt = `Evaluate this debate on "${session.topic.title}". \n${transcript}\nReturn ONLY JSON with {"winnerId", "reasoning", "fallaciesFound"}.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);

      this.logger.log(`AI Evaluation Complete for ${debateId}`);
      // In production: Save result.response.text() to DB and emit websocket event
    } catch (e) {
      this.logger.error('AI Judge failed', e);
    }
  }
}
