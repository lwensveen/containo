'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ShipmentsPanel } from './shipments';
import { PickupsPanel } from './pickups';
import { InboundPanel } from '@/components/dashboard/inbound';

const DEMO_USER = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? '00000000-0000-0000-0000-000000000000';

export function DashboardView() {
  const search = useSearchParams();
  const initialTab = (search.get('tab') as 'shipments' | 'pickups') ?? 'shipments';

  const { data: session } = authClient.useSession();
  const authedId = (session?.user as any)?.id as string | undefined;

  const [userId, setUserId] = useState<string>(authedId || DEMO_USER);

  useEffect(() => {
    const qUser = search.get('user');
    if (qUser) setUserId(qUser);
    else if (authedId) setUserId(authedId);
  }, [authedId, search]);

  const onTabChange = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your shipments and pickups.</p>
        </div>
        <Input
          placeholder="Buyer userId (UUID)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-[320px]"
        />
      </div>

      <Tabs defaultValue={initialTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="flex w-full max-w-full flex-wrap gap-2">
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="inbound">Inbound</TabsTrigger>
          <TabsTrigger value="pickups">Pickups</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="mt-6">
          <ShipmentsPanel userId={userId} />
        </TabsContent>

        <TabsContent value="inbound" className="mt-6">
          <InboundPanel userId={userId} />
        </TabsContent>

        <TabsContent value="pickups" className="mt-6">
          <PickupsPanel userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
