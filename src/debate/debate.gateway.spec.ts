import { Test, TestingModule } from '@nestjs/testing';
import { DebateGateway } from './debate.gateway';

describe('DebateGateway', () => {
  let gateway: DebateGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DebateGateway],
    }).compile();

    gateway = module.get<DebateGateway>(DebateGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
