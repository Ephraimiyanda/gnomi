import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TopicService } from './topic/topic.service';
import { TopicController } from './topic/topic.controller';
import { TopicModule } from './topic/topic.module';
import { DebateModule } from './debate/debate.module';
import { AiJudgeModule } from './ai-judge/ai-judge.module';

@Module({
  imports: [TopicModule, DebateModule, AiJudgeModule],
  controllers: [AppController, TopicController],
  providers: [AppService, TopicService],
})
export class AppModule {}
