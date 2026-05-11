import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DebateService } from './debate.service';
import { OnEvent } from '@nestjs/event-emitter';
import { AiEvaluation } from 'src/ai-judge/ai-judge.service';

@WebSocketGateway({ cors: true })
export class DebateGateway {
  @WebSocketServer() server: Server;

  constructor(private debateService: DebateService) {}

  @SubscribeMessage('joinRoom')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody('debateId') debateId: string,
  ) {
    client.join(debateId);
  }

  @SubscribeMessage('submitTurn')
  async handleTurn(
    @MessageBody()
    data: {
      debateId: string;
      speakerId: string;
      content: string;
      roundNum: number;
    },
  ) {
    const round = await this.debateService.processTurn(
      data.debateId,
      data.speakerId,
      data.content,
      data.roundNum,
    );
    this.server.to(data.debateId).emit('turnProcessed', round);

    if (data.roundNum >= 6) {
      this.server.to(data.debateId).emit('votingStarted');
    }
  }
  // src/debate/debate.gateway.ts

  @OnEvent('debate.completed')
  handleDebateCompleted(payload: {
    debateId: string;
    evaluation: AiEvaluation;
  }) {
    // Notify all room participants that the judge has finished
    this.server.to(payload.debateId).emit('DEBATE_FINISHED', {
      winnerId: payload.evaluation.winnerId,
      report: payload.evaluation,
    });
  }
}
