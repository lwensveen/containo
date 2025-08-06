import { timestamp } from 'drizzle-orm/pg-core';
export const defaultTimestampOptions = {
    withTimezone: true,
    mode: 'date',
};
export const createTimestampColumn = (columnName, isUpdatedColumn = false) => {
    const column = timestamp(columnName, defaultTimestampOptions).notNull().defaultNow();
    return isUpdatedColumn ? column.$onUpdateFn(() => new Date()) : column;
};
