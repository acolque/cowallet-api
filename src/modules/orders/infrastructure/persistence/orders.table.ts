import { integer, numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import {
  ORDER_SIDES,
  ORDER_STATUSES,
  ORDER_TYPES,
} from '../../domain/order';

export const orders = pgTable('orders', {
  id: integer('id').primaryKey(),
  userId: integer('userid').notNull(),
  instrumentId: integer('instrumentid').notNull(),
  size: numeric('size').notNull(),
  price: numeric('price').notNull(),
  type: varchar('type', { enum: ORDER_TYPES }).notNull(),
  side: varchar('side', { enum: ORDER_SIDES }).notNull(),
  status: varchar('status', { enum: ORDER_STATUSES }).notNull(),
  datetime: timestamp('datetime').notNull(),
});
