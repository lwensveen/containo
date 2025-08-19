import { Card, CardContent } from '@/components/ui/card';

export function Metric({ title, value }: { title: string; value: number | string }) {
  return (
    <Card className="border-slate-200/70">
      <CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
