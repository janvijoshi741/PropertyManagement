import { useParams } from 'react-router-dom';
import { useStatement } from '@/hooks/useStatements';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Building } from 'lucide-react';

export function StatementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: statement, isPending, isError, refetch } = useStatement(id || '');

  if (isPending) return <LoadingSkeleton type="detail" />;
  if (isError || !statement) return <ErrorState message="Statement not found" onRetry={refetch} />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Statement {statement.statement_number}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statement Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statement.properties && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">
                {statement.properties.address_line1}, {statement.properties.city}, {statement.properties.postcode}
              </span>
            </div>
          )}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Statement Number</p>
              <p className="font-medium">{statement.statement_number}</p>
            </div>
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="text-xl font-bold text-slate-800">£{Number(statement.amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500">Period From</p>
              <p className="font-medium">{statement.period_from}</p>
            </div>
            <div>
              <p className="text-slate-500">Period To</p>
              <p className="font-medium">{statement.period_to}</p>
            </div>
          </div>
          <Separator />
          <a
            href={`/api/documents/statement/${statement.id}/view?token=${localStorage.getItem('accessToken')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px h-8 gap-1.5 px-2.5 w-full"
          >
            <Download className="h-4 w-4 mr-2" /> Download Statement
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
