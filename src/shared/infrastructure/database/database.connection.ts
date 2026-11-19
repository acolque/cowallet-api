import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function connectionStringFromEnv(): string {
  const url = new URL(requiredEnv('DATABASE_URL'));
  url.username = requiredEnv('DATABASE_USER');
  url.password = requiredEnv('DATABASE_PASSWORD');

  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (!local && !url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }

  return url.toString();
}

@Injectable()
export class DatabaseConnection implements OnModuleDestroy {
  readonly pool: Pool;
  readonly db: NodePgDatabase;

  constructor() {
    this.pool = new Pool({
      connectionString: connectionStringFromEnv(),
    });
    this.db = drizzle(this.pool);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
