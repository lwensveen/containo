import { db, poolsTable } from '@containo/db';
import { eq } from 'drizzle-orm';

export async function bookContainer(poolId: string): Promise<void> {
  const [pool] = await db.select().from(poolsTable).where(eq(poolsTable.id, poolId));

  if (!pool) throw new Error(`Pool not found: ${poolId}`);

  const apiUrl = process.env.MAERSK_SANDBOX_URL!;
  const apiKey = process.env.MAERSK_SANDBOX_API_KEY!;

  const resp = await fetch(`${apiUrl}/v1/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      poolId: pool.id,
      originPort: pool.originPort,
      destPort: pool.destPort,
      volumeM3: pool.capacityM3.toString(),
      mode: pool.mode,
      cutoffISO: pool.cutoffISO,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Maersk booking failed: ${resp.status}`);
  }

  const { bookingId } = await resp.json();

  await db
    .update(poolsTable)
    .set({ status: 'booked', bookingRef: bookingId })
    .where(eq(poolsTable.id, poolId));
}
