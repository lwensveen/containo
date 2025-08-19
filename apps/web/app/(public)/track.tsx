'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TrackPage() {
  const [v, setV] = useState('');
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.trim()) return;
    // If you later support both IDs and signed tokens, branch here.
    router.push(`/pickups/track/${encodeURIComponent(v.trim())}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Section className="pt-24 pb-10">
        <Container>
          <h1 className="font-heading text-5xl font-extrabold tracking-tight text-slate-900">
            Track a shipment
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Enter your tracking ID or link token. You’ll see live status from pickup to delivery.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex max-w-lg gap-2">
            <Input
              value={v}
              onChange={(e) => setV(e.target.value)}
              placeholder="e.g. CTRK-9F2C or eyJkIjoi..."
              className="h-11"
              aria-label="Tracking code"
            />
            <Button type="submit" className="h-11 px-5">
              Track
            </Button>
          </form>
        </Container>
      </Section>
    </main>
  );
}
