import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-2 animate-pulse rounded bg-slate-200" />
      </CardContent>
    </Card>
  );
}
