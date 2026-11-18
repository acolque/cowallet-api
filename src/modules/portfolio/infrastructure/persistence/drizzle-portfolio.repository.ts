import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { marketdata } from '../../../instruments/infrastructure/persistence/marketdata.table';
import { orders } from '../../../orders/infrastructure/persistence/orders.table';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/database.connection';
import {
  InstrumentPosition,
  InstrumentPrice,
  PortfolioRepository,
} from '../../domain/portfolio.repository';

@Injectable()
export class DrizzlePortfolioRepository extends PortfolioRepository {
  constructor(private readonly database: DatabaseConnection) {
    super();
  }

  async getCashBalanceArs(userId: number): Promise<string> {
    const [row] = await this.database.db
      .select({
        cashBalanceArs: sql<string>`coalesce(sum(
          case
            when ${orders.side} = 'CASH_IN' then ${orders.size}
            when ${orders.side} = 'CASH_OUT' then -${orders.size}
            when ${orders.side} = 'BUY' then -(${orders.size} * ${orders.price})
            when ${orders.side} = 'SELL' then ${orders.size} * ${orders.price}
            else 0
          end
        ), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, 'FILLED')));

    return row?.cashBalanceArs ?? '0';
  }

  async getNetInstrumentPositions(userId: number): Promise<InstrumentPosition[]> {
    return this.database.db
      .select({
        instrumentId: orders.instrumentId,
        netSize: sql<string>`coalesce(sum(
          case
            when ${orders.side} = 'BUY' then ${orders.size}
            when ${orders.side} = 'SELL' then -${orders.size}
            else 0
          end
        ), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.status, 'FILLED'),
          inArray(orders.side, ['BUY', 'SELL']),
        ),
      )
      .groupBy(orders.instrumentId);
  }

  async getLatestPrices(instrumentIds: number[]): Promise<InstrumentPrice[]> {
    if (instrumentIds.length === 0) {
      return [];
    }

    return this.database.db
      .selectDistinctOn([marketdata.instrumentId], {
        instrumentId: marketdata.instrumentId,
        close: marketdata.close,
      })
      .from(marketdata)
      .where(inArray(marketdata.instrumentId, instrumentIds))
      .orderBy(marketdata.instrumentId, desc(marketdata.date));
  }
}
