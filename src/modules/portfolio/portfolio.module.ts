import { Module } from '@nestjs/common';
import { GetCashBalanceUseCase } from './application/get-cash-balance.use-case';
import { CashBalanceRepository } from './domain/cash-balance.repository';
import { PortfolioController } from './infrastructure/http/portfolio.controller';
import { DrizzleCashBalanceRepository } from './infrastructure/persistence/drizzle-cash-balance.repository';
import { PortfolioModuleStatusAdapter } from './infrastructure/portfolio-module-status.adapter';

@Module({
  controllers: [PortfolioController],
  providers: [
    PortfolioModuleStatusAdapter,
    GetCashBalanceUseCase,
    {
      provide: CashBalanceRepository,
      useClass: DrizzleCashBalanceRepository,
    },
  ],
})
export class PortfolioModule {}
