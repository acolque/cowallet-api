import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';

export const instruments = pgTable('instruments', {
  id: integer('id').primaryKey(),
  ticker: varchar('ticker').notNull(),
  name: varchar('name').notNull(),
  type: varchar('type').notNull(),
});
