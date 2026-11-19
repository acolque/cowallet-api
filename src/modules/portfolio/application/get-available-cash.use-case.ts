import { Injectable } from '@nestjs/common';
import { availableCashArs } from '../domain/available-cash';
import { PortfolioRepository } from '../domain/portfolio.repository';

@Injectable()
export class GetAvailableCashUseCase {
  constructor(private readonly portfolio: PortfolioRepository) {}

  async execute(userId: number): Promise<string> {
    const [cashBalanceArs, reservedBuyCashArs] = await Promise.all([
      this.portfolio.getCashBalanceArs(userId),
      this.portfolio.getReservedBuyCashArs(userId),
    ]);

    return availableCashArs(cashBalanceArs, reservedBuyCashArs);
  }
}
