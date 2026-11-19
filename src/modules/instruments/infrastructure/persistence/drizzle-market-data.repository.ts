import { Injectable } from '@nestjs/common';
import { desc, inArray } from 'drizzle-orm';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/database.connection';
import {
  LatestPrice,
  MarketDataRepository,
} from '../../domain/market-data.repository';
import { marketdata } from './marketdata.table';

@Injectable()
export class DrizzleMarketDataRepository extends MarketDataRepository {
  constructor(private readonly database: DatabaseConnection) {
    super();
  }

  async getLatestPrices(instrumentIds: number[]): Promise<LatestPrice[]> {
    if (instrumentIds.length === 0) {
      return [];
    }

    return this.database.db
      .selectDistinctOn([marketdata.instrumentId], {
        instrumentId: marketdata.instrumentId,
        close: marketdata.close,
        previousClose: marketdata.previousClose,
      })
      .from(marketdata)
      .where(inArray(marketdata.instrumentId, instrumentIds))
      .orderBy(marketdata.instrumentId, desc(marketdata.date));
  }
}
