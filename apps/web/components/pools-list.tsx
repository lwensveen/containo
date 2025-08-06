import React, { useEffect, useState } from 'react';
import { Pool } from '@containo/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function PoolsList() {
  const [pools, setPools] = useState<Pool[] | null>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/pools');
      if (!res.ok) throw new Error(`Failed to fetch pools: ${res.status}`);
      const data: Pool[] = await res.json();
      setPools(data);
    } catch (err) {
      console.error('Error fetching poolsTable', err);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleBook = async (poolId: string) => {
    setLoadingMap((prev) => ({ ...prev, [poolId]: true }));
    try {
      const res = await fetch('/api/consolidation/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId }),
      });
      if (!res.ok) throw new Error(`Booking failed: ${res.status}`);
      await fetchPools();
    } catch (err) {
      console.error('Booking failed', err);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [poolId]: false }));
    }
  };

  if (!pools) return <div>Loading pools…</div>;

  return (
    <div className="space-y-4">
      {pools.map((pool) => {
        const fillPercent = (Number(pool.usedM3) / Number(pool.capacityM3)) * 100;
        return (
          <div key={pool.id} className="flex items-center space-x-4 p-4 border rounded">
            <div className="flex-1">
              <div className="font-medium">
                {pool.originPort} → {pool.destPort} ({pool.mode})
              </div>
              <Progress value={fillPercent} className="mt-1 w-full" />
            </div>
            <Button
              onClick={() => handleBook(pool.id)}
              disabled={loadingMap[pool.id] || pool.status !== 'open'}
            >
              {loadingMap[pool.id] ? 'Booking…' : pool.status === 'open' ? 'Book' : 'Booked'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
