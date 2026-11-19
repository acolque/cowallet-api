import { Injectable } from '@nestjs/common';
import { OrderReadRepository } from '../../orders/domain/order-read.repository';
import { availableCashArs } from '../domain/available-cash';

@Injectable()
export class GetAvailableCashUseCase {
  constructor(private readonly orderRead: OrderReadRepository) {}

  async execute(userId: number): Promise<string> {
    const [filledCashEffect, openLimitBuyNotional] = await Promise.all([
      this.orderRead.sumFilledCashEffect(userId),
      this.orderRead.sumOpenLimitBuyNotional(userId),
    ]);

    return availableCashArs(filledCashEffect, openLimitBuyNotional);
  }
}
