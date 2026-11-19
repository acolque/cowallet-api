import { Module } from '@nestjs/common';
import { InstrumentsModule } from '../instruments/instruments.module';
import { OrderReadModule } from '../orders/order-read.module';
import { GetUserPortfolioUseCase } from './application/get-user-portfolio.use-case';
import { PortfolioController } from './infrastructure/http/portfolio.controller';
import { PortfolioModuleStatusAdapter } from './infrastructure/portfolio-module-status.adapter';

@Module({
  imports: [InstrumentsModule, OrderReadModule],
  controllers: [PortfolioController],
  providers: [PortfolioModuleStatusAdapter, GetUserPortfolioUseCase],
})
export class PortfolioModule {}
