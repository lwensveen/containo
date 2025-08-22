import { sendMail } from '../../lib/mailer.js';

const WEB = process.env.WEB_BASE_URL || 'http://localhost:3000';

function fmtDate(d?: Date | string | null) {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleString();
}

/** Ask buyer to forward to their seller */
export async function emailSellerInstructions(args: {
  to: string;
  buyerName?: string | null;
  hubCode: string;
  hubLocation?: string | null;
  labelUrl?: string | null;
}) {
  const subject = `Your seller instructions & hub code: ${args.hubCode}`;
  const text = [
    `Hi${args.buyerName ? ` ${args.buyerName}` : ''},`,
    ``,
    `Share these instructions with your seller:`,
    ``,
    `1) Put this code on the parcel label: ${args.hubCode}`,
    `2) Include the courier tracking number (DHL/UPS/GLS etc.)`,
    `3) Ship to our hub${args.hubLocation ? ` (${args.hubLocation})` : ''}`,
    ``,
    args.labelUrl ? `Label (auto-filled): ${args.labelUrl}` : '',
    `Dashboard: ${WEB}/(protected)/dashboard?tab=inbound`,
    ``,
    `Thanks,`,
    `Containo`,
  ]
    .filter(Boolean)
    .join('\n');

  await sendMail({ to: args.to, subject, text });
}

export async function emailInboundReceived(args: {
  to: string;
  buyerName?: string | null;
  inboundId: string;
  hubCode: string;
  sellerName?: string | null;
  extTracking?: string | null;
  freeUntilAt?: Date | string | null;
  photoUrl?: string | null;
}) {
  const subject = `We received your parcel (${args.hubCode})`;
  const text = [
    `Hi${args.buyerName ? ` ${args.buyerName}` : ''},`,
    ``,
    `We’ve received your parcel at the hub.`,
    args.sellerName ? `Seller: ${args.sellerName}` : '',
    args.extTracking ? `Tracking: ${args.extTracking}` : '',
    `Hub code: ${args.hubCode}`,
    `Free storage until: ${fmtDate(args.freeUntilAt)}`,
    args.photoUrl ? `Photo: ${args.photoUrl}` : '',
    ``,
    `View it here: ${WEB}/(protected)/dashboard?tab=inbound`,
    ``,
    `– Containo`,
  ]
    .filter(Boolean)
    .join('\n');

  await sendMail({ to: args.to, subject, text });
}

export async function emailInboundMeasuredPendingPrice(args: {
  to: string;
  buyerName?: string | null;
  inboundId: string;
  dims?: { l?: number | null; w?: number | null; h?: number | null; kg?: number | null };
}) {
  const subject = `Measured – price coming next`;
  const text = [
    `Hi${args.buyerName ? ` ${args.buyerName}` : ''},`,
    ``,
    `We measured your parcel. Pricing will appear in your dashboard shortly.`,
    args.dims
      ? `Dims: ${args.dims.l ?? '–'}×${args.dims.w ?? '–'}×${args.dims.h ?? '–'} cm • ${args.dims.kg ?? '–'} kg`
      : '',
    ``,
    `Dashboard: ${WEB}/(protected)/dashboard?tab=inbound`,
    `– Containo`,
  ]
    .filter(Boolean)
    .join('\n');

  await sendMail({ to: args.to, subject, text });
}

export async function emailPaymentSuccess(args: {
  to: string;
  buyerName?: string | null;
  amountUsd?: number | null;
  sessionId?: string | null;
}) {
  const subject = `Payment received`;
  const receipt = args.sessionId
    ? `${WEB}/(protected)/checkout/success?session_id=${args.sessionId}`
    : `${WEB}/(protected)/checkout`;
  const text = [
    `Hi${args.buyerName ? ` ${args.buyerName}` : ''},`,
    ``,
    `Thanks! Your payment${args.amountUsd ? ` (${args.amountUsd.toFixed(2)} USD)` : ''} was received.`,
    `Receipt: ${receipt}`,
    ``,
    `You’ll see status updates in your dashboard.`,
    `– Containo`,
  ].join('\n');

  await sendMail({ to: args.to, subject, text });
}
