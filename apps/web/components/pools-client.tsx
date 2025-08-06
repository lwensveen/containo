'use client';

import { useState } from 'react';
import { Pool } from '@containo/types';
import PoolsUI from '@/components/pools-ui';

interface PoolsClientProps {
  initialPools: Pool[];
}

export default function PoolsClient({ initialPools }: PoolsClientProps) {
  const [pools, setPools] = useState<Pool[]>(initialPools);

  const refresh = async () => {
    const refreshed = await fetch('/api/pools').then((r) => r.json());
    setPools(refreshed);
  };

  return <PoolsUI pools={pools} onRefresh={refresh} />;
}
