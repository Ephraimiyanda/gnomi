import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DebateService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2, // Replaced AiJudgeService with EventEmitter
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
        durationSeconds: 60,
      },
    });

    // Check if debate is over (e.g., max 6 rounds total)
    if (roundNum >= 6) {
      await this.prisma.debateSession.update({
        where: { id: debateId },
        data: { status: 'VOTING' },
      });

      // Emit an event instead of calling the AI service directly
      this.eventEmitter.emit('debate.ended', { debateId });
    }

    return round;
  }

  // --- NEW VOTING LOGIC ---

  async registerVote(debateId: string, userId: string, votedForUserId: string) {
    // 1. Prevent double voting
    const existingVote = await this.prisma.vote.findFirst({
      where: { debateSessionId: debateId, userId: userId },
    });

    if (existingVote) {
      throw new BadRequestException('User has already voted in this debate.');
    }

    // 2. Record the vote
    const vote = await this.prisma.vote.create({
      data: {
        debateSessionId: debateId,
        userId: userId,
        votedForUserId: votedForUserId,
      },
    });

    // 3. Get the updated live tally
    const tallies = await this.prisma.vote.groupBy({
      by: ['votedForUserId'],
      where: { debateSessionId: debateId },
      _count: { votedForUserId: true },
    });

    // Format the tally nicely for the frontend (e.g., { "user1_id": 4, "user2_id": 7 })
    const formattedTally = tallies.reduce(
      (acc, curr) => {
        acc[curr.votedForUserId] = curr._count.votedForUserId;
        return acc;
      },
      {} as Record<string, number>,
    );

    return { vote, tally: formattedTally };
  }
}
