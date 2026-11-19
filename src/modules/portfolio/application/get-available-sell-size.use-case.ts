import { Injectable } from '@nestjs/common';
import { OrderReadRepository } from '../../orders/domain/order-read.repository';
import { availableSellSize } from '../domain/available-sell-size';

@Injectable()
export class GetAvailableSellSizeUseCase {
  constructor(private readonly orderRead: OrderReadRepository) {}

  async execute(userId: number, instrumentId: number): Promise<string> {
    const [positions, openLimitSellSize] = await Promise.all([
      this.orderRead.netFilledSizeByInstrument(userId),
      this.orderRead.sumOpenLimitSellSize(userId, instrumentId),
    ]);
    const netSize =
      positions.find((position) => position.instrumentId === instrumentId)
        ?.netSize ?? '0';

    return availableSellSize(netSize, openLimitSellSize);
  }
}
