import { Module } from '@nestjs/common';
import { InstrumentsModule } from '../instruments/instruments.module';
import { OrderReadModule } from '../orders/order-read.module';
import { GetAvailableCashUseCase } from './application/get-available-cash.use-case';
import { GetAvailableSellSizeUseCase } from './application/get-available-sell-size.use-case';
import { GetUserPortfolioUseCase } from './application/get-user-portfolio.use-case';
import { PortfolioController } from './infrastructure/http/portfolio.controller';
import { PortfolioModuleStatusAdapter } from './infrastructure/portfolio-module-status.adapter';

@Module({
  imports: [InstrumentsModule, OrderReadModule],
  controllers: [PortfolioController],
  providers: [
    PortfolioModuleStatusAdapter,
    GetUserPortfolioUseCase,
    GetAvailableCashUseCase,
    GetAvailableSellSizeUseCase,
  ],
  exports: [GetAvailableCashUseCase, GetAvailableSellSizeUseCase],
})
export class PortfolioModule {}
