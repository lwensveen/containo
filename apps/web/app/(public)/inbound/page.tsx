'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Container } from '@/components/layout/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function InboundLanding() {
  const [code, setCode] = useState('');
  const router = useRouter();

  function go() {
    const c = code.trim();
    if (!c) return;
    router.push(`/inbound/${encodeURIComponent(c.toUpperCase())}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Container className="py-16">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-slate-900">Inbound instructions</h1>
          <p className="mt-2 text-slate-600">
            Enter a <b>Hub Code</b> to view printable shipping instructions for sellers.
          </p>
          <div className="mt-5 flex gap-2">
            <Input
              placeholder="CTN-TH-ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && go()}
            />
            <Button onClick={go}>Open</Button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Tip: share a direct link like <code>/inbound/CTN-TH-ABC123</code>.
          </p>
        </div>
      </Container>
    </main>
  );
}
