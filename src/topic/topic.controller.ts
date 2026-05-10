import { Controller, Post, Get, Body } from '@nestjs/common';
import { TopicService } from './topic.service';

@Controller('topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  create(
    @Body() body: { title: string; description: string; creatorId: string },
  ) {
    return this.topicService.create(
      body.title,
      body.description,
      body.creatorId,
    );
  }

  @Get()
  findAll() {
    return this.topicService.findAll();
  }
}
