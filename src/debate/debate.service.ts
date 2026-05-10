import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { AiJudgeService } from '../ai-judge/ai-judge.service';

@Injectable()
export class DebateService {
  constructor(
    private prisma: PrismaService,
    private aiJudge: AiJudgeService,
  ) {}

  async processTurn(
    debateId: string,
    speakerId: string,
    content: string,
    roundNum: number,
  ) {
    const round = await this.prisma.round.create({
      data: {
        debateSessionId: debateId,
        speakerId,
        content,
        roundNumber: roundNum,
      },
    });

    // Check if debate is over (e.g., max 6 rounds total)
    if (roundNum >= 6) {
      await this.prisma.debateSession.update({
        where: { id: debateId },
        data: { status: 'VOTING' },
      });
      // Trigger AI Async
      this.aiJudge.evaluateDebate(debateId);
    }

    return round;
  }
}
