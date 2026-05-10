import { Injectable } from '@nestjs/common';
import { PrismaService } from '../core/prisma/prisma.service';

@Injectable()
export class TopicService {
  constructor(private prisma: PrismaService) {}

  async create(title: string, description: string, creatorId: string) {
    return this.prisma.topic.create({
      data: { title, description, creatorId },
    });
  }

  async findAll() {
    return this.prisma.topic.findMany({ take: 50, orderBy: { id: 'desc' } });
  }
}
