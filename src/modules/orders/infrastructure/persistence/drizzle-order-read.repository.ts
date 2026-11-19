import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/database.connection';
import {
  FilledInstrumentSize,
  OrderReadRepository,
} from '../../domain/order-read.repository';
import { orders } from './orders.table';

@Injectable()
export class DrizzleOrderReadRepository extends OrderReadRepository {
  constructor(private readonly database: DatabaseConnection) {
    super();
  }

  async sumFilledCashEffect(userId: number): Promise<string> {
    const [row] = await this.database.db
      .select({
        cashEffect: sql<string>`coalesce(sum(
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

    return row?.cashEffect ?? '0';
  }

  async sumOpenLimitBuyNotional(userId: number): Promise<string> {
    const [row] = await this.database.db
      .select({
        notional: sql<string>`coalesce(sum(${orders.size} * ${orders.price}), 0)`,
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

    return row?.notional ?? '0';
  }

  async sumOpenLimitSellSize(
    userId: number,
    instrumentId: number,
  ): Promise<string> {
    const [row] = await this.database.db
      .select({
        size: sql<string>`coalesce(sum(${orders.size}), 0)`,
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

    return String(row?.size ?? '0');
  }

  async netFilledSizeByInstrument(
    userId: number,
  ): Promise<FilledInstrumentSize[]> {
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
