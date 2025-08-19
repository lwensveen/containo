import { redirect } from 'next/navigation';

export default async function Cancel({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const keys = ['origin', 'dest', 'mode', 'cutoff', 'w', 'l', 'wi', 'h'] as const;
  const qs = new URLSearchParams({ canceled: '1' });

  for (const k of keys) {
    const v = sp[k];
    if (typeof v === 'string') qs.set(k, v);
  }

  redirect(`/checkout?${qs.toString()}`);
}
