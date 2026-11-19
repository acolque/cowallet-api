import { Injectable } from '@nestjs/common';
import { availableSellSize } from '../domain/available-sell-size';
import { PortfolioRepository } from '../domain/portfolio.repository';

@Injectable()
export class GetAvailableSellSizeUseCase {
  constructor(private readonly portfolio: PortfolioRepository) {}

  async execute(userId: number, instrumentId: number): Promise<string> {
    const [positions, reservedSellSize] = await Promise.all([
      this.portfolio.getNetInstrumentPositions(userId),
      this.portfolio.getReservedSellSize(userId, instrumentId),
    ]);
    const netSize =
      positions.find((position) => position.instrumentId === instrumentId)
        ?.netSize ?? '0';

    return availableSellSize(netSize, reservedSellSize);
  }
}
