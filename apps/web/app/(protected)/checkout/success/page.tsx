import { redirect } from 'next/navigation';

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const sid = typeof sp.session_id === 'string' ? sp.session_id : undefined;

  redirect(`/dashboard${sid ? `?session_id=${encodeURIComponent(sid)}` : ''}`);
}
