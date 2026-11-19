import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/database.connection';
import { orders } from '../../../orders/infrastructure/persistence/orders.table';
import {
  InstrumentPosition,
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

  async getReservedBuyCashArs(userId: number): Promise<string> {
    const [row] = await this.database.db
      .select({
        reservedCashArs: sql<string>`coalesce(sum(${orders.size} * ${orders.price}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.side, 'BUY'),
          eq(orders.status, 'NEW'),
          eq(orders.type, 'LIMIT'),
        ),
      );

    return row?.reservedCashArs ?? '0';
  }

  async getReservedSellSize(
    userId: number,
    instrumentId: number,
  ): Promise<string> {
    const [row] = await this.database.db
      .select({
        reservedSize: sql<string>`coalesce(sum(${orders.size}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.instrumentId, instrumentId),
          eq(orders.side, 'SELL'),
          eq(orders.status, 'NEW'),
          eq(orders.type, 'LIMIT'),
        ),
      );

    return String(row?.reservedSize ?? '0');
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
}
