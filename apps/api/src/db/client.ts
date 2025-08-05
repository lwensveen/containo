import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { items, pools } from './schema.js';

const connectionString = process.env.DATABASE_URL!;

export const sql = postgres(connectionString, {
  prepare: false,
  ssl: connectionString.includes('sslmode=require') ? 'require' : undefined,
});

export const db = drizzle(sql);

export { items, pools };
