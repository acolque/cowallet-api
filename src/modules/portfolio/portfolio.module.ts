import { Module } from '@nestjs/common';
import { GetUserPortfolioUseCase } from './application/get-user-portfolio.use-case';
import { PortfolioRepository } from './domain/portfolio.repository';
import { PortfolioController } from './infrastructure/http/portfolio.controller';
import { DrizzlePortfolioRepository } from './infrastructure/persistence/drizzle-portfolio.repository';
import { PortfolioModuleStatusAdapter } from './infrastructure/portfolio-module-status.adapter';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioModuleStatusAdapter,
    GetUserPortfolioUseCase,
    {
      provide: PortfolioRepository,
      useClass: DrizzlePortfolioRepository,
    },
  ],
})
export class PortfolioModule {}
