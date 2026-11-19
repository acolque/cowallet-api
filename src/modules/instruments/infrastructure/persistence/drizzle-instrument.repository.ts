import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { DatabaseConnection } from '../../../../shared/infrastructure/database/database.connection';
import { Instrument } from '../../domain/instrument';
import {
  InstrumentRepository,
  SearchInstrumentsCriteria,
} from '../../domain/instrument.repository';
import { instruments } from './instruments.table';

const LIKE_ESCAPE = '\\';

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `${LIKE_ESCAPE}${character}`);
}

@Injectable()
export class DrizzleInstrumentRepository extends InstrumentRepository {
  constructor(private readonly database: DatabaseConnection) {
    super();
  }

  async search(criteria: SearchInstrumentsCriteria): Promise<Instrument[]> {
    const escaped = escapeLike(criteria.query);
    const contains = `%${escaped}%`;
    const prefix = `${escaped}%`;
    const relevance = sql`case
      when lower(${instruments.ticker}) = lower(${criteria.query}) then 0
      when ${instruments.ticker} ilike ${prefix} escape ${LIKE_ESCAPE} then 1
      when ${instruments.name} ilike ${prefix} escape ${LIKE_ESCAPE} then 2
      else 3
    end`;

    return this.database.db
      .select({
        id: instruments.id,
        ticker: instruments.ticker,
        name: instruments.name,
        type: instruments.type,
      })
      .from(instruments)
      .where(
        and(
          eq(instruments.type, criteria.type),
          or(
            sql`${instruments.ticker} ilike ${contains} escape ${LIKE_ESCAPE}`,
            sql`${instruments.name} ilike ${contains} escape ${LIKE_ESCAPE}`,
          ),
        ),
      )
      .orderBy(relevance, asc(instruments.ticker))
      .limit(criteria.limit);
  }

  async findById(id: number): Promise<Instrument | null> {
    const [row] = await this.database.db
      .select({
        id: instruments.id,
        ticker: instruments.ticker,
        name: instruments.name,
        type: instruments.type,
      })
      .from(instruments)
      .where(eq(instruments.id, id))
      .limit(1);

    return row ?? null;
  }

  async findByIds(ids: number[]): Promise<Instrument[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.database.db
      .select({
        id: instruments.id,
        ticker: instruments.ticker,
        name: instruments.name,
        type: instruments.type,
      })
      .from(instruments)
      .where(inArray(instruments.id, ids));
  }
}
