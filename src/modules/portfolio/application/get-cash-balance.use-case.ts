import { Injectable } from '@nestjs/common';
import { CashBalance } from '../domain/cash-balance';
import { CashBalanceRepository } from '../domain/cash-balance.repository';

@Injectable()
export class GetCashBalanceUseCase {
  constructor(private readonly cashBalanceRepository: CashBalanceRepository) {}

  async execute(userId: number): Promise<CashBalance> {
    const cashBalanceArs =
      await this.cashBalanceRepository.getCashBalanceArs(userId);

    return { userId, cashBalanceArs };
  }
}
