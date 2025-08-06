import { Pool } from '@containo/types';
import { getPools } from '@/lib/api';
import PoolsClient from '@/components/pools-client';

export default async function Page() {
  const pools: Pool[] = await getPools();
  return (
    <main className="p-6">
      <PoolsClient initialPools={pools} />
    </main>
  );
}
