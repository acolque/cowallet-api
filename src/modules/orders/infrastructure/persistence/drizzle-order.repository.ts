import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/database.connection';
import { Order } from '../../domain/order';
import { NewOrder, OrderRepository } from '../../domain/order.repository';
import { orders } from './orders.table';
import { users } from './users.table';

@Injectable()
export class DrizzleOrderRepository extends OrderRepository {
  constructor(private readonly database: DatabaseConnection) {
    super();
  }

  async userExists(userId: number): Promise<boolean> {
    const [row] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return row !== undefined;
  }

  async insert(order: NewOrder): Promise<Order> {
    const [row] = await this.database.db
      .insert(orders)
      .values({
        userId: order.userId,
        instrumentId: order.instrumentId,
        size: order.size,
        price: order.price,
        type: order.type,
        side: order.side,
        status: order.status,
        datetime: order.datetime,
      })
      .returning();

    if (row === undefined) {
      throw new Error('Order insert did not return a row');
    }

    return toOrder(row);
  }

  async findById(orderId: number): Promise<Order | null> {
    const [row] = await this.database.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    return row === undefined ? null : toOrder(row);
  }

  async cancelIfNew(orderId: number, userId: number): Promise<Order | null> {
    const [row] = await this.database.db
      .update(orders)
      .set({ status: 'CANCELLED' })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.userId, userId),
          eq(orders.status, 'NEW'),
        ),
      )
      .returning();

    return row === undefined ? null : toOrder(row);
  }

  executeWithUserLock<T>(userId: number, action: () => Promise<T>): Promise<T> {
    return this.database.transaction(async () => {
      await this.database.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .for('update');

      return action();
    });
  }
}

function toOrder(row: typeof orders.$inferSelect): Order {
  return new Order(
    row.id,
    row.userId,
    row.instrumentId,
    row.size,
    row.price,
    row.type,
    row.side,
    row.status,
    row.datetime,
  );
}
