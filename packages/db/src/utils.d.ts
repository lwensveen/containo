import { PgTimestampConfig } from 'drizzle-orm/pg-core';
export declare const defaultTimestampOptions: PgTimestampConfig;
export declare const createTimestampColumn: (
  columnName: string,
  isUpdatedColumn?: boolean
) => import('drizzle-orm').HasDefault<
  import('drizzle-orm').NotNull<import('drizzle-orm/pg-core').PgTimestampBuilderInitial<string>>
>;
//# sourceMappingURL=utils.d.ts.map
