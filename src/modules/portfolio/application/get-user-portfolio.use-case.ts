import { Injectable } from '@nestjs/common';
import { addDecimal, multiplyDecimal } from '../domain/decimal';
import { PortfolioRepository } from '../domain/portfolio.repository';
import { UserPortfolio } from '../domain/user-portfolio';

@Injectable()
export class GetUserPortfolioUseCase {
  constructor(private readonly portfolioRepository: PortfolioRepository) {}

  async execute(userId: number): Promise<UserPortfolio> {
    const [cashBalanceArs, positions] = await Promise.all([
      this.portfolioRepository.getCashBalanceArs(userId),
      this.portfolioRepository.getNetInstrumentPositions(userId),
    ]);

    const prices = await this.portfolioRepository.getLatestPrices(
      positions.map((position) => position.instrumentId),
    );
    const closeByInstrument = new Map(
      prices.map((price) => [price.instrumentId, price.close]),
    );

    const marketValueArs = positions.reduce((total, position) => {
      const close = closeByInstrument.get(position.instrumentId);
      if (close === undefined) {
        return total;
      }

      return addDecimal(total, multiplyDecimal(position.netSize, close));
    }, '0');

    return {
      userId,
      cashBalanceArs,
      totalBalanceArs: addDecimal(cashBalanceArs, marketValueArs),
    };
  }
}
