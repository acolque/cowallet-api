import { Module } from '@nestjs/common';
import { InstrumentsModule } from '../instruments/instruments.module';
import { GetAvailableCashUseCase } from './application/get-available-cash.use-case';
import { GetAvailableSellSizeUseCase } from './application/get-available-sell-size.use-case';
import { GetUserPortfolioUseCase } from './application/get-user-portfolio.use-case';
import { PortfolioRepository } from './domain/portfolio.repository';
import { PortfolioController } from './infrastructure/http/portfolio.controller';
import { DrizzlePortfolioRepository } from './infrastructure/persistence/drizzle-portfolio.repository';
import { PortfolioModuleStatusAdapter } from './infrastructure/portfolio-module-status.adapter';

@Module({
  imports: [InstrumentsModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioModuleStatusAdapter,
    GetUserPortfolioUseCase,
    GetAvailableCashUseCase,
    GetAvailableSellSizeUseCase,
    {
      provide: PortfolioRepository,
      useClass: DrizzlePortfolioRepository,
    },
  ],
  exports: [GetAvailableCashUseCase, GetAvailableSellSizeUseCase],
})
export class PortfolioModule {}
