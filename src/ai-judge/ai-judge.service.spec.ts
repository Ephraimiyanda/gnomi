import { Test, TestingModule } from '@nestjs/testing';
import { AiJudgeService } from './ai-judge.service';

describe('AiJudgeService', () => {
  let service: AiJudgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiJudgeService],
    }).compile();

    service = module.get<AiJudgeService>(AiJudgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
