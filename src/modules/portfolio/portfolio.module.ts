import { Module } from '@nestjs/common';
import { GetAvailableCashUseCase } from './application/get-available-cash.use-case';
import { GetAvailableSellSizeUseCase } from './application/get-available-sell-size.use-case';
import { GetLatestCloseUseCase } from './application/get-latest-close.use-case';
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
    GetAvailableCashUseCase,
    GetAvailableSellSizeUseCase,
    GetLatestCloseUseCase,
    {
      provide: PortfolioRepository,
      useClass: DrizzlePortfolioRepository,
    },
  ],
  exports: [
    GetAvailableCashUseCase,
    GetAvailableSellSizeUseCase,
    GetLatestCloseUseCase,
  ],
})
export class PortfolioModule {}
