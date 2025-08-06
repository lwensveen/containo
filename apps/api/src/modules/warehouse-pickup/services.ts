import { z } from 'zod/v4';
import { eq, InferSelectModel } from 'drizzle-orm';
import { db, warehousePickups } from '@containo/db';
import { createPickupSchema } from '@containo/types';

export type Pickup = InferSelectModel<typeof warehousePickups>;

export async function createPickup(data: z.infer<typeof createPickupSchema>): Promise<Pickup> {
  const [pickup] = await db
    .insert(warehousePickups)
    .values({
      courier: data.courier,
      scheduleAt: data.scheduleISO,
      items: data.items,
    })
    .returning();

  if (!pickup) {
    throw new Error('Failed to insert pickup record');
  }

  const apiUrl = process.env.COURIER_SANDBOX_URL!;
  const apiKey = process.env.COURIER_SANDBOX_API_KEY!;

  try {
    const response = await fetch(`${apiUrl}/v1/pickups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        pickupId: pickup.id,
        courier: data.courier,
        scheduleAt: data.scheduleISO,
        items: data.items,
      }),
    });
    if (!response.ok) {
      throw new Error(`Courier sandbox error: ${response.status}`);
    }
    await response.json();

    await db
      .update(warehousePickups)
      .set({ status: 'dispatched', updatedAt: new Date() })
      .where(eq(warehousePickups.id, pickup.id));

    return { ...pickup, status: 'dispatched' } as Pickup;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    await db
      .update(warehousePickups)
      .set({ status: 'error', updatedAt: new Date() })
      .where(eq(warehousePickups.id, pickup.id));

    console.error('Courier sandbox failed:', msg);
    return { ...pickup, status: 'error' } as Pickup;
  }
}

export async function listPickups(): Promise<Pickup[]> {
  return db.select().from(warehousePickups).orderBy(warehousePickups.scheduleAt);
}
