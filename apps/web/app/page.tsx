'use client';

import { useEffect, useMemo, useState } from 'react';
import { getPools, intent, quote } from '@/lib/api';

type Mode = 'sea' | 'air';

export default function Home() {
  const [mode, setMode] = useState<Mode>('sea');
  const [weightKg, setWeightKg] = useState(3.5);
  const [dims, setDims] = useState({ length: 40, width: 30, height: 30 });

  const [originPort, setOriginPort] = useState('AMS');
  const [destPort, setDestPort] = useState('BKK');
  const [cutoffISO, setCutoffISO] = useState<string>('2025-08-15');
  const [userId, setUserId] = useState('demo-user');

  const [q, setQ] = useState<Awaited<ReturnType<typeof quote>> | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  const [pools, setPools] = useState<Awaited<ReturnType<typeof getPools>>>([]);
  const [loadingPools, setLoadingPools] = useState(false);

  const fill = (p: { usedM3: string; capacityM3: string }) =>
    Math.min(1, Number(p.usedM3) / Number(p.capacityM3));

  useEffect(() => {
    (async () => {
      setLoadingPools(true);
      try {
        setPools(await getPools());
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPools(false);
      }
    })();
  }, []);

  const canQuote = useMemo(
    () => weightKg > 0 && dims.length > 0 && dims.width > 0 && dims.height > 0,
    [weightKg, dims]
  );

  async function onQuote() {
    setJoinMsg(null);
    setLoadingQuote(true);
    try {
      const r = await quote({ mode, weightKg, dimsCm: dims });
      setQ(r);
    } catch (e: any) {
      setQ(null);
      setJoinMsg(e?.message ?? 'Quote failed');
    } finally {
      setLoadingQuote(false);
    }
  }

  async function onJoin() {
    if (!q) return;
    setJoinMsg(null);
    try {
      const r = await intent({
        userId,
        originPort,
        destPort,
        mode,
        cutoffISO,
        weightKg,
        dimsCm: dims,
      });
      setJoinMsg(`Joined pool with item ID ${r.id}, volume ${q.volumeM3.toFixed(4)} m³`);
      // refresh pools
      setPools(await getPools());
    } catch (e: any) {
      setJoinMsg(e?.message ?? 'Join failed');
    }
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1>Containo — pooled shipping</h1>

      <section style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <h2>Get a quote</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="sea">Sea</option>
              <option value="air">Air</option>
            </select>
          </label>
          <label>
            Weight (kg)
            <input
              type="number"
              value={weightKg}
              min={0.1}
              step={0.1}
              onChange={(e) => setWeightKg(Number(e.target.value))}
            />
          </label>
          <label>
            Length (cm)
            <input
              type="number"
              value={dims.length}
              min={1}
              onChange={(e) => setDims({ ...dims, length: Number(e.target.value) })}
            />
          </label>
          <label>
            Width (cm)
            <input
              type="number"
              value={dims.width}
              min={1}
              onChange={(e) => setDims({ ...dims, width: Number(e.target.value) })}
            />
          </label>
          <label>
            Height (cm)
            <input
              type="number"
              value={dims.height}
              min={1}
              onChange={(e) => setDims({ ...dims, height: Number(e.target.value) })}
            />
          </label>
        </div>

        <button disabled={!canQuote || loadingQuote} onClick={onQuote}>
          {loadingQuote ? 'Calculating...' : 'Quote'}
        </button>

        {q && (
          <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
            <div>
              <strong>User price:</strong> ${q.userPrice}
            </div>
            <div>
              Cost basis: ${q.costBasis} • Service fee: ${q.serviceFee} • Margin: ${q.margin}
            </div>
            <div>
              Volume: {q.volumeM3.toFixed(4)} m³ • Billable kg: {q.billableKg.toFixed(2)}
            </div>
          </div>
        )}
      </section>

      <section style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <h2>Join pool</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label>
            User ID
            <input value={userId} onChange={(e) => setUserId(e.target.value)} />
          </label>
          <label>
            Origin port
            <input value={originPort} onChange={(e) => setOriginPort(e.target.value)} />
          </label>
          <label>
            Destination port
            <input value={destPort} onChange={(e) => setDestPort(e.target.value)} />
          </label>
          <label>
            Cutoff (ISO)
            <input value={cutoffISO} onChange={(e) => setCutoffISO(e.target.value)} />
          </label>
        </div>
        <button disabled={!q} onClick={onJoin}>
          Join with last quote
        </button>
        {joinMsg && <p>{joinMsg}</p>}
      </section>

      <section style={{ display: 'grid', gap: 12 }}>
        <h2>Open pools</h2>
        <button onClick={async () => setPools(await getPools())} disabled={loadingPools}>
          {loadingPools ? 'Refreshing...' : 'Refresh'}
        </button>

        <div style={{ display: 'grid', gap: 8 }}>
          {pools.map((p) => (
            <div key={p.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
              <div>
                <strong>
                  {p.originPort} → {p.destPort}
                </strong>{' '}
                ({p.mode}) • cutoff {p.cutoffISO}
              </div>
              <div>
                Status: {p.status} • Fill: {(fill(p) * 100).toFixed(1)}% (
                {Number(p.usedM3).toFixed(3)}/{Number(p.capacityM3).toFixed(3)} m³)
              </div>
            </div>
          ))}
          {!pools.length && <div>No pools yet.</div>}
        </div>
      </section>
    </main>
  );
}
