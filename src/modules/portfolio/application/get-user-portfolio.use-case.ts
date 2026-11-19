import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  addDecimal,
  isNegativeDecimal,
  multiplyDecimal,
  percentageChange,
} from '../../../shared/domain/decimal';
import { InstrumentRepository } from '../../instruments/domain/instrument.repository';
import { MarketDataRepository } from '../../instruments/domain/market-data.repository';
import { availableCashArs } from '../../orders/domain/available-cash';
import { OrderReadRepository } from '../../orders/domain/order-read.repository';
import { UserPortfolio } from '../domain/user-portfolio';

@Injectable()
export class GetUserPortfolioUseCase {
  constructor(
    private readonly orderRead: OrderReadRepository,
    private readonly marketData: MarketDataRepository,
    private readonly instruments: InstrumentRepository,
    @InjectPinoLogger(GetUserPortfolioUseCase.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(userId: number): Promise<UserPortfolio> {
    const [cashBalanceArs, reservedBuyCashArs, positions] = await Promise.all([
      this.orderRead.sumFilledCashEffect(userId),
      this.orderRead.sumOpenLimitBuyNotional(userId),
      this.orderRead.netFilledSizeByInstrument(userId),
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

    const instrumentIds = valuedPositions.map(
      (position) => position.instrumentId,
    );
    const [prices, instruments] = await Promise.all([
      this.marketData.getLatestPrices(instrumentIds),
      this.instruments.findByIds(instrumentIds),
    ]);
    const priceByInstrument = new Map(
      prices.map((price) => [price.instrumentId, price]),
    );
    const instrumentById = new Map(
      instruments.map((instrument) => [instrument.id, instrument]),
    );

    const assets = valuedPositions.flatMap((position) => {
      const price = priceByInstrument.get(position.instrumentId);
      if (price === undefined) {
        return [];
      }

      const instrument = instrumentById.get(position.instrumentId);

      return [
        {
          instrumentId: position.instrumentId,
          ticker: instrument?.ticker ?? null,
          name: instrument?.name ?? null,
          netSize: position.netSize,
          positionValueArs: multiplyDecimal(position.netSize, price.close),
          dailyReturnPercentage: percentageChange(
            price.close,
            price.previousClose,
          ),
        },
      ];
    });

    const marketValueArs = assets.reduce(
      (total, asset) => addDecimal(total, asset.positionValueArs),
      '0',
    );

    return {
      userId,
      cashBalanceArs,
      availableCashArs: availableCashArs(cashBalanceArs, reservedBuyCashArs),
      totalBalanceArs: addDecimal(cashBalanceArs, marketValueArs),
      assets,
    };
  }
}
