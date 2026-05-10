import { Module } from '@nestjs/common';
import { AiJudgeService } from './ai-judge.service';

@Module({
  providers: [AiJudgeService],
  exports: [AiJudgeService],
})
export class AiJudgeModule {}
