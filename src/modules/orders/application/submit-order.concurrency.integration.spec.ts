import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { MarketDataRepository } from '../../instruments/domain/market-data.repository';
import { DrizzleInstrumentRepository } from '../../instruments/infrastructure/persistence/drizzle-instrument.repository';
import { DatabaseConnection } from '../../../shared/infrastructure/database/database.connection';
import { DrizzleOrderReadRepository } from '../infrastructure/persistence/drizzle-order-read.repository';
import { DrizzleOrderRepository } from '../infrastructure/persistence/drizzle-order.repository';
import { SubmitOrderUseCase } from './submit-order.use-case';

const USER_ID = 1;
const INSTRUMENT_ID = 47;

const SCHEMA = `
CREATE TABLE users (
  id integer PRIMARY KEY
);

CREATE TABLE instruments (
  id integer PRIMARY KEY,
  ticker varchar NOT NULL,
  name varchar NOT NULL,
  type varchar NOT NULL
);

CREATE SEQUENCE orders_id_seq;

CREATE TABLE orders (
  id integer PRIMARY KEY DEFAULT nextval('orders_id_seq'),
  userid integer NOT NULL,
  instrumentid integer NOT NULL,
  size integer NOT NULL,
  price numeric NOT NULL,
  type varchar NOT NULL,
  side varchar NOT NULL,
  status varchar NOT NULL,
  datetime timestamp NOT NULL
);
`;

describe('SubmitOrderUseCase concurrency', () => {
  let container: StartedPostgreSqlContainer;
  let database: DatabaseConnection;
  let useCase: SubmitOrderUseCase;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.DATABASE_USER = container.getUsername();
    process.env.DATABASE_PASSWORD = container.getPassword();

    database = new DatabaseConnection();
    await database.pool.query(SCHEMA);
    await database.pool.query(
      `INSERT INTO users (id) VALUES ($1)`,
      [USER_ID],
    );
    await database.pool.query(
      `INSERT INTO instruments (id, ticker, name, type) VALUES ($1, $2, $3, $4)`,
      [INSTRUMENT_ID, 'TEST', 'Test instrument', 'ACCIONES'],
    );

    useCase = new SubmitOrderUseCase(
      new DrizzleOrderRepository(database),
      new DrizzleInstrumentRepository(database),
      new DrizzleOrderReadRepository(database),
      { getLatestPrices: () => Promise.resolve([]) } as unknown as MarketDataRepository,
    );
  });

  afterAll(async () => {
    await database?.onModuleDestroy();
    await container?.stop();
  });

  beforeEach(async () => {
    await database.pool.query('DELETE FROM orders');
    await database.pool.query(
      `INSERT INTO orders (userid, instrumentid, size, price, type, side, status, datetime)
       VALUES ($1, $2, 40, 1.00, 'MARKET', 'BUY', 'FILLED', NOW())`,
      [USER_ID, INSTRUMENT_ID],
    );
  });

  it('accepts one limit sell and rejects the other when both race for the same size', async () => {
    const [sell30, sell20] = await Promise.all([
      useCase.execute({
        userId: USER_ID,
        instrumentId: INSTRUMENT_ID,
        side: 'SELL',
        type: 'LIMIT',
        size: 30,
        price: '1.00',
      }),
      useCase.execute({
        userId: USER_ID,
        instrumentId: INSTRUMENT_ID,
        side: 'SELL',
        type: 'LIMIT',
        size: 20,
        price: '1.00',
      }),
    ]);

    expect(sell30).toEqual(expect.objectContaining({ size: 30, status: 'NEW', side: 'SELL' }));
    expect(sell20).toEqual(expect.objectContaining({ size: 20, status: 'REJECTED', side: 'SELL' }));

    const reserved = await database.pool.query<{ size: number }>(
      `SELECT size
       FROM orders
       WHERE userid = $1
         AND instrumentid = $2
         AND side = 'SELL'
         AND type = 'LIMIT'
         AND status = 'NEW'`,
      [USER_ID, INSTRUMENT_ID],
    );
    expect(reserved.rows).toEqual([{ size: 30 }]);
  });
});
