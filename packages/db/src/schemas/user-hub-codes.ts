import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { usersTable } from './users/users.js';
import { createTimestampColumn } from '../utils.js';

export const userHubCodesTable = pgTable(
  'user_hub_codes',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    hubCode: text('hub_code').notNull(),
    hubLocation: text('hub_location').notNull().default('NL-AMS Hub'),
    createdAt: createTimestampColumn('created_at'),
    updatedAt: createTimestampColumn('updated_at', true),
  },
  (t) => [uniqueIndex('ux_user_hub_code').on(t.hubCode)]
);
