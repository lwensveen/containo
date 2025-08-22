import { and, desc, eq } from 'drizzle-orm';
import {
  db,
  inboundEventsTable,
  inboundParcelsTable,
  userHubCodesTable,
  usersTable,
} from '@containo/db';
import type { InboundDeclare, InboundReceive } from '@containo/types';
import { findNextOpenPoolIdForLane } from '../lanes/services.js';
import { emitInboundEvent } from '../events/services/emit-inbound-event.js';
import {
  emailInboundMeasuredPendingPrice,
  emailInboundReceived,
} from '../notifications/inbound-emails.js';

function genHubCode(country: string = 'TH') {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CTN-${country}-${rand}`;
}

export async function ensureHubCode(userId: string) {
  const existing = await db.query.userHubCodesTable.findFirst({
    where: eq(userHubCodesTable.userId, userId),
  });

  if (existing) return existing;

  const [row] = await db
    .insert(userHubCodesTable)
    .values({ userId, hubCode: genHubCode(), hubLocation: 'NL-AMS Hub' })
    .returning();
  return row!;
}

export async function declareInbound(input: InboundDeclare) {
  const hub = await ensureHubCode(input.userId);
  const [row] = await db
    .insert(inboundParcelsTable)
    .values({
      userId: input.userId,
      hubCode: hub.hubCode,
      originPort: input.originPort.toUpperCase(),
      destPort: input.destPort.toUpperCase(),
      mode: input.mode,
      sellerName: input.sellerName ?? null,
      extTracking: input.extTracking ?? null,
      lengthCm: input.lengthCm ?? null,
      widthCm: input.widthCm ?? null,
      heightCm: input.heightCm ?? null,
      weightKg: input.weightKg != null ? String(input.weightKg) : null,
      notes: input.notes ?? null,
      status: 'expected',
    })
    .returning();

  await emitInboundEvent({
    inboundId: row!.id,
    type: 'declared',
    payload: { extTracking: row!.extTracking, sellerName: row!.sellerName },
  });

  return row!;
}

export async function listInboundByUser(userId: string) {
  return db
    .select()
    .from(inboundParcelsTable)
    .where(eq(inboundParcelsTable.userId, userId))
    .orderBy(desc(inboundParcelsTable.createdAt));
}

export async function getHubCodeForUser(userId: string) {
  return await ensureHubCode(userId);
}

export async function hubReceiveOrMeasure(args: InboundReceive) {
  if (!args.inboundId && !(args.hubCode && args.extTracking)) {
    throw new Error('Provide inboundId OR (hubCode + extTracking)');
  }

  const criteria = args.inboundId
    ? eq(inboundParcelsTable.id, args.inboundId)
    : and(
        eq(inboundParcelsTable.hubCode, args.hubCode!),
        eq(inboundParcelsTable.extTracking, args.extTracking!)
      );

  const [prev] = await db.select().from(inboundParcelsTable).where(criteria).limit(1);

  if (!prev) throw new Error('Inbound not found');

  const receivedAt = args.receivedAt ? new Date(args.receivedAt) : new Date();
  const freeDays = args.freeDays ?? 7;
  const freeUntilAt = new Date(receivedAt.getTime() + freeDays * 86_400_000);
  const originPort = (args as any).originPort ?? prev.originPort;
  const destPort = (args as any).destPort ?? prev.destPort;
  const mode = (args as any).mode ?? prev.mode;

  const nextPoolId =
    originPort && destPort && mode
      ? await findNextOpenPoolIdForLane({
          originPort: String(originPort).toUpperCase(),
          destPort: String(destPort).toUpperCase(),
          mode: mode as 'air' | 'sea',
        }).catch(() => null)
      : null;

  const measured =
    args.lengthCm != null || args.widthCm != null || args.heightCm != null || args.weightKg != null;

  return await db.transaction(async (tx) => {
    const [row] = await tx
      .update(inboundParcelsTable)
      .set({
        status: 'received',
        receivedAt,
        freeUntilAt,
        lengthCm: args.lengthCm ?? undefined,
        widthCm: args.widthCm ?? undefined,
        heightCm: args.heightCm ?? undefined,
        weightKg: args.weightKg != null ? String(args.weightKg) : undefined,
        photoUrl: args.photoUrl ?? undefined,
        poolId: prev.poolId ?? nextPoolId ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(inboundParcelsTable.id, prev.id))
      .returning();

    if (!row) throw new Error('Failed to update inbound');

    await tx.insert(inboundEventsTable).values({
      inboundId: row.id,
      type: measured ? 'measured' : 'received',
      payload: {
        lengthCm: args.lengthCm ?? null,
        widthCm: args.widthCm ?? null,
        heightCm: args.heightCm ?? null,
        weightKg: args.weightKg ?? null,
        photoUrl: args.photoUrl ?? null,
        freeDays,
        autoLinkedPoolId: nextPoolId,
      },
    });

    try {
      const [u] = await db
        .select({ email: usersTable.email, name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, prev.userId))
        .limit(1);

      const to = u?.email;
      if (to) {
        if (prev.status === 'expected') {
          await emailInboundReceived({
            to,
            buyerName: u?.name ?? null,
            inboundId: row.id,
            hubCode: row.hubCode,
            sellerName: row.sellerName ?? undefined,
            extTracking: row.extTracking ?? undefined,
            freeUntilAt: row.freeUntilAt ?? null,
            photoUrl: row.photoUrl ?? undefined,
          });
        }

        if (measured) {
          await emailInboundMeasuredPendingPrice({
            to,
            buyerName: u?.name ?? null,
            inboundId: row.id,
            dims: {
              l: row.lengthCm ?? null,
              w: row.widthCm ?? null,
              h: row.heightCm ?? null,
              kg: row.weightKg != null ? Number(row.weightKg) : null,
            },
          });
        }
      }
    } catch (e) {
      console.warn('[mail] inbound notify failed:', e);
    }

    return row;
  });
}

export async function requestPriorityShip(inboundId: string, userId: string) {
  const [row] = await db
    .update(inboundParcelsTable)
    .set({ updatedAt: new Date() })
    .where(and(eq(inboundParcelsTable.id, inboundId), eq(inboundParcelsTable.userId, userId)))
    .returning();

  if (!row) throw new Error('Inbound not found');

  await emitInboundEvent({
    inboundId,
    type: 'priority_requested',
    payload: {},
  });

  return row;
}
