export function expectOne<T>(rows: T[], msg: string): T {
  const row = rows[0];
  if (!row) throw new Error(msg);
  return row;
}
