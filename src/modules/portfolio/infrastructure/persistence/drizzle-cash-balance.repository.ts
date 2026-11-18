import { Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { orders } from '../../../orders/infrastructure/persistence/orders.table';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/database.connection';
import { CashBalanceRepository } from '../../domain/cash-balance.repository';

@Injectable()
export class DrizzleCashBalanceRepository extends CashBalanceRepository {
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
}
