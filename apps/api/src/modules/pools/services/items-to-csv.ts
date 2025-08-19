import type { listItemsByPool } from './list-items-by-pool.js';

export function itemsToCsv(rows: Awaited<ReturnType<typeof listItemsByPool>>) {
  const header = [
    'id',
    'userId',
    'poolId',
    'originPort',
    'destPort',
    'mode',
    'cutoffAt',
    'weightKg',
    'volumeM3',
    'length',
    'width',
    'height',
    'status',
    'createdAt',
  ];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.userId,
        row.poolId ?? '',
        row.originPort,
        row.destPort,
        row.mode,
        row.cutoffAt,
        row.weightKg,
        row.volumeM3,
        row.length,
        row.width,
        row.height,
        row.status,
        (row as any).createdAt?.toISOString?.() ?? (row as any).createdAt,
      ]
        .map(escape)
        .join(',')
    ),
  ];
  return lines.join('\n');
}
