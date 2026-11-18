import { date, integer, numeric, pgTable } from 'drizzle-orm/pg-core';

export const marketdata = pgTable('marketdata', {
  instrumentId: integer('instrumentid').notNull(),
  close: numeric('close').notNull(),
  date: date('date').notNull(),
});
