'use client';

import { Pool } from '@containo/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PoolsUIProps {
  pools: Pool[];
  onRefresh: () => void;
}

export default function PoolsUI({ pools, onRefresh }: PoolsUIProps) {
  const fillPercent = (p: Pool) => {
    const used = parseFloat(p.usedM3);
    const cap = parseFloat(p.capacityM3);
    return isNaN(used) || isNaN(cap) || cap <= 0 ? 0 : Math.min(1, used / cap);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={onRefresh}>Refresh</Button>
      </div>
      <div className="space-y-4">
        {pools.length ? (
          pools.map((pool) => (
            <Card key={pool.id}>
              <CardHeader>
                <CardTitle>
                  {pool.originPort} → {pool.destPort} ({pool.mode})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Status: <span className="capitalize">{pool.status}</span>
                </p>
                <Progress value={fillPercent(pool) * 100} className="w-full mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          <div>No pools available.</div>
        )}
      </div>
    </>
  );
}
