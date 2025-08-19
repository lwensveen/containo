import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Shipment } from '@/components/dashboard/shipments';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const receiptUrl = (sessionId: string) => `${API}/payments/receipt/${sessionId}.pdf`;
const statusColor = (s: Shipment['status']) =>
  s === 'pooled'
    ? 'bg-amber-600'
    : s === 'pay_pending'
      ? 'bg-blue-600'
      : s === 'paid'
        ? 'bg-indigo-600'
        : s === 'shipped'
          ? 'bg-sky-600'
          : s === 'delivered'
            ? 'bg-emerald-600'
            : s === 'refunded'
              ? 'bg-rose-600'
              : 'bg-slate-500';

export function ShipmentCard({ s }: { s: Shipment }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-heading text-lg">
          {s.originPort ?? '—'} → {s.destPort ?? '—'} {s.mode ? `(${s.mode})` : ''}
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${statusColor(s.status)}`} />
          {s.poolStatus && (
            <Badge variant="outline" className="capitalize">
              {s.poolStatus.replace(/_/g, ' ')}
            </Badge>
          )}
          {s.status === 'paid' && <Badge className="bg-emerald-600">Paid</Badge>}
          {s.status === 'pay_pending' && <Badge className="bg-amber-600">Payment pending</Badge>}
          {s.status === 'refunded' && <Badge className="bg-rose-600">Refunded</Badge>}
          {!['paid', 'pay_pending', 'refunded'].includes(s.status) && (
            <span className="text-sm capitalize">{s.status.replace(/_/g, ' ')}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-slate-600">
          Item: <span className="font-mono">{s.itemId.slice(0, 8)}…</span> • Created:{' '}
          {new Date(s.createdAt).toLocaleString()}
          {s.cutoffAt && <> • Cut-off: {new Date(s.cutoffAt).toLocaleString()}</>}
          {s.bookingRef && (
            <>
              {' '}
              • Booking: <span className="font-mono">{s.bookingRef}</span>
            </>
          )}
          {s.stripeSessionId && (
            <>
              {' '}
              •{' '}
              <a
                className="underline"
                href={receiptUrl(s.stripeSessionId)}
                target="_blank"
                rel="noreferrer"
              >
                Download receipt
              </a>
            </>
          )}
        </div>
        <div className="text-sm text-slate-600">
          {s.weightKg} kg • {s.volumeM3.toFixed(2)} m³ • {s.length}×{s.width}×{s.height} cm
        </div>
        {s.fillPercent !== null && (
          <div>
            <div className="mb-1 text-xs text-slate-500">
              Pool fill: {(s.fillPercent * 100).toFixed(0)}%
            </div>
            <Progress value={Math.round((s.fillPercent ?? 0) * 100)} />
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {s.bookingRef ? (
            <Button asChild variant="outline" size="sm">
              <a href={`/pickups/track/${encodeURIComponent(s.bookingRef)}`}>Track</a>
            </Button>
          ) : null}
          {s.status === 'pay_pending' && s.stripeSessionId ? (
            <Button asChild size="sm">
              <a href={`/checkout?session_id=${encodeURIComponent(s.stripeSessionId)}`}>
                Complete payment
              </a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
