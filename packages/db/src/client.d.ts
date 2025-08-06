import postgres from 'postgres';
import { items, pools } from './schema.js';
export declare const sql: postgres.Sql<{}>;
export declare const db: import('drizzle-orm/postgres-js').PostgresJsDatabase<
  Record<string, never>
> & {
  $client: postgres.Sql<{}>;
};
export { items, pools };
//# sourceMappingURL=client.d.ts.map
