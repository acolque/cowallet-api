import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { addDecimal, isNegativeDecimal, multiplyDecimal } from '../domain/decimal';
import { PortfolioRepository } from '../domain/portfolio.repository';
import { UserPortfolio } from '../domain/user-portfolio';

@Injectable()
export class GetUserPortfolioUseCase {
  constructor(
    private readonly portfolioRepository: PortfolioRepository,
    @InjectPinoLogger(GetUserPortfolioUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(userId: number): Promise<UserPortfolio> {
    const [cashBalanceArs, positions] = await Promise.all([
      this.portfolioRepository.getCashBalanceArs(userId),
      this.portfolioRepository.getNetInstrumentPositions(userId),
    ]);

    const valuedPositions = positions.filter((position) => {
      if (!isNegativeDecimal(position.netSize)) {
        return true;
      }

      this.logger.error(
        {
          userId,
          instrumentId: position.instrumentId,
          netSize: position.netSize,
        },
        'Negative net instrument position ignored',
      );
      return false;
    });

    const prices = await this.portfolioRepository.getLatestPrices(
      valuedPositions.map((position) => position.instrumentId),
    );
    const closeByInstrument = new Map(
      prices.map((price) => [price.instrumentId, price.close]),
    );

    const marketValueArs = valuedPositions.reduce((total, position) => {
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
