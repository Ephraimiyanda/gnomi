import { Test, TestingModule } from '@nestjs/testing';
import { TopicService } from './topic.service';
import { PrismaService } from '../core/prisma/prisma.service';

describe('TopicService', () => {
  let service: TopicService;
  let prisma: PrismaService;

  const mockPrisma = {
    topic: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TopicService>(TopicService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a topic', async () => {
    const topicData = {
      title: 'AI Rights',
      description: '...',
      creatorId: '1',
    };
    mockPrisma.topic.create.mockResolvedValue({ id: '123', ...topicData });

    const result = await service.create(
      topicData.title,
      topicData.description,
      topicData.creatorId,
    );

    expect(prisma.topic.create).toHaveBeenCalledWith({ data: topicData });
    expect(result.id).toBe('123');
  });
});
