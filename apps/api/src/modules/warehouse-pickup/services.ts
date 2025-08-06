import { eq } from 'drizzle-orm';
import { db, warehousePickupsTable } from '@containo/db';
import { WarehousePickup, WarehousePickupInsert } from '@containo/types';

export async function createPickup(data: WarehousePickupInsert): Promise<WarehousePickup> {
  const [pickup] = await db
    .insert(warehousePickupsTable)
    .values({
      courier: data.courier,
      scheduleAt: data.scheduleAt,
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
        scheduleAt: data.scheduleAt,
        items: data.items,
      }),
    });

    if (!response.ok) {
      throw new Error(`Courier sandbox error: ${response.status}`);
    }

    await response.json();

    await db
      .update(warehousePickupsTable)
      .set({ status: 'dispatched', updatedAt: new Date() })
      .where(eq(warehousePickupsTable.id, pickup.id));

    return { ...pickup, status: 'dispatched' } as WarehousePickup;
  } catch (err) {
    await db
      .update(warehousePickupsTable)
      .set({ status: 'error', updatedAt: new Date() })
      .where(eq(warehousePickupsTable.id, pickup.id));

    console.error('Courier sandbox failed:', err);
    return { ...pickup, status: 'error' } as WarehousePickup;
  }
}

export async function listPickups(): Promise<WarehousePickup[]> {
  return db.select().from(warehousePickupsTable).orderBy(warehousePickupsTable.scheduleAt);
}
