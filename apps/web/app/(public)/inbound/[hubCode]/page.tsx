import { Container } from '@/components/layout/container';
import { cn } from '@/lib/utils';
import React from 'react';

function PrintButton() {
  'use client';

  return (
    <button
      onClick={() => window.print()}
      className="rounded-md border bg-black px-3 py-2 text-white hover:opacity-90 print:hidden"
    >
      Print
    </button>
  );
}

function AddressBlock({ lines }: { lines: string[] }) {
  return (
    <address className="not-italic leading-6 text-slate-800">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </address>
  );
}

export default async function InboundSharePage({
  params,
}: {
  params: Promise<{ hubCode: string }>;
}) {
  const { hubCode: raw } = await params;
  const hubCode = decodeURIComponent(raw).toUpperCase();

  const HUB_NAME = process.env.NEXT_PUBLIC_HUB_NAME ?? 'NL-AMS Hub (set NEXT_PUBLIC_HUB_NAME)';
  const HUB_ADDRESS1 = process.env.NEXT_PUBLIC_HUB_ADDRESS1 ?? 'Set NEXT_PUBLIC_HUB_ADDRESS1';
  const HUB_ADDRESS2 = process.env.NEXT_PUBLIC_HUB_ADDRESS2 ?? '';
  const HUB_POSTCODE = process.env.NEXT_PUBLIC_HUB_POSTCODE ?? '';
  const HUB_CITY = process.env.NEXT_PUBLIC_HUB_CITY ?? '';
  const HUB_COUNTRY = process.env.NEXT_PUBLIC_HUB_COUNTRY ?? 'NL';
  const HUB_CONTACT = process.env.NEXT_PUBLIC_HUB_CONTACT ?? '';
  const HUB_PHONE = process.env.NEXT_PUBLIC_HUB_PHONE ?? '';
  const HUB_EMAIL = process.env.NEXT_PUBLIC_HUB_EMAIL ?? '';

  const addrLines = [
    HUB_NAME,
    HUB_ADDRESS1,
    ...(HUB_ADDRESS2 ? [HUB_ADDRESS2] : []),
    [HUB_POSTCODE, HUB_CITY].filter(Boolean).join(' '),
    HUB_COUNTRY,
  ].filter(Boolean);

  const qrPayload = `HUB:${hubCode};TO:${HUB_NAME};ADDR:${[
    HUB_ADDRESS1,
    HUB_ADDRESS2,
    HUB_POSTCODE,
    HUB_CITY,
    HUB_COUNTRY,
  ]
    .filter(Boolean)
    .join(', ')};NOTE:Put HUB CODE on outer label + inside box;`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrPayload
  )}`;

  return (
    <main className="bg-white">
      <Container className="py-10 print:py-0">
        <div
          className={cn(
            'mx-auto w-full max-w-3xl rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-slate-900/10',
            'print:mx-0 print:w-auto print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none print:ring-0'
          )}
        >
          <header className="mb-6 flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Ship to hub</div>
              <h1 className="font-heading mt-1 text-2xl font-bold text-slate-900">
                Containo inbound receiving
              </h1>
            </div>
            <PrintButton />
          </header>

          <section className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/10">
              <div className="text-sm font-medium text-slate-700">Hub Address</div>
              <AddressBlock lines={addrLines} />
              {(HUB_CONTACT || HUB_PHONE || HUB_EMAIL) && (
                <div className="mt-3 text-sm text-slate-600">
                  {HUB_CONTACT && <div>Contact: {HUB_CONTACT}</div>}
                  {HUB_PHONE && <div>Phone: {HUB_PHONE}</div>}
                  {HUB_EMAIL && <div>Email: {HUB_EMAIL}</div>}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-900/10">
              <div className="text-xs uppercase tracking-wide text-slate-500">Hub Code</div>
              <div className="rounded-md bg-slate-900 px-3 py-2 font-mono text-2xl font-semibold tracking-widest text-white">
                {hubCode}
              </div>
              <img
                src={qrUrl}
                alt={`QR code for ${hubCode}`}
                className="mt-2 h-[220px] w-[220px] rounded-md border bg-white"
              />
              <div className="text-center text-xs text-slate-500">
                Put this code on the outer label and one copy inside the box.
              </div>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/inbound/label.pdf?hubCode=${encodeURIComponent(hubCode)}`}
                target="_blank"
                rel="noreferrer"
                className="print:hidden text-sm underline"
              >
                Download PDF label
              </a>
            </div>
          </section>

          <section className="mt-8 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-slate-900">
              Packing & labeling instructions
            </h2>
            <ol className="list-decimal space-y-2 pl-6 text-sm text-slate-700">
              <li>
                Write the hub code <b>{hubCode}</b> on the outer label, and include a second copy
                inside the box (or print this page and put it inside).
              </li>
              <li>
                Add your own courier tracking number on the label. If you have a packing list, put
                it inside the box.
              </li>
              <li>
                If the item is fragile, mark the box clearly and add any handling notes on the
                label.
              </li>
              <li>
                Ship to the address above. When the parcel arrives at the hub, we will{' '}
                <b>receive, measure, and assign</b> it to the next consolidation pool for its lane.
              </li>
            </ol>
          </section>

          <footer className="mt-8 border-t pt-4 text-xs text-slate-500">
            Questions? Contact your buyer or support.
          </footer>
        </div>
      </Container>
    </main>
  );
}
