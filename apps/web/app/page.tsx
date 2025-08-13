import { Pool } from '@containo/types';
import PoolsClient from '@/components/pools-client';

export default async function Page() {
  // const pools: Pool[] = await getPools();
  const pools: Pool[] = [];

  return (
    <main className="p-6">
      <PoolsClient initialPools={pools} />
    </main>
  );
}
