import { Module } from '@nestjs/common';
import { DebateGateway } from './debate.gateway';
import { DebateService } from './debate.service';
import { AiJudgeModule } from '../ai-judge/ai-judge.module';

@Module({
  imports: [AiJudgeModule],
  providers: [DebateGateway, DebateService],
})
export class DebateModule {}
