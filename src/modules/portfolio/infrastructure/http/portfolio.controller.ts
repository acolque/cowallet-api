import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { GetCashBalanceUseCase } from '../../application/get-cash-balance.use-case';
import { CashBalance } from '../../domain/cash-balance';

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly getCashBalance: GetCashBalanceUseCase) {}

  @Get(':userId')
  get(@Param('userId', ParseIntPipe) userId: number): Promise<CashBalance> {
    return this.getCashBalance.execute(userId);
  }
}
