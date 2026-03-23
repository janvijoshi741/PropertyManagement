import { useAllInvoices } from '@/hooks/useInvoices';
import { useAllStatements } from '@/hooks/useStatements';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { InvoiceRow, StatementRow } from '@/components/shared/DocumentRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Receipt, FileText } from 'lucide-react';

export function DocumentsPage() {
  const { data: invoices, isPending: invLoading, isError: invError, refetch: refetchInv } = useAllInvoices();
  const { data: statements, isPending: stmtLoading, isError: stmtError, refetch: refetchStmt } = useAllStatements();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
        <p className="text-slate-500 mt-1">View and download your invoices and statements</p>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="statements" className="gap-2">
            <FileText className="h-4 w-4" /> Statements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          {invLoading && <LoadingSkeleton rows={4} />}
          {invError && <ErrorState message="Failed to load invoices" onRetry={refetchInv} />}
          {invoices && invoices.length === 0 && (
            <EmptyState title="No invoices" description="You don't have any invoices yet." />
          )}
          {invoices && invoices.length > 0 && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Invoice No</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Property</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Issue Date</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Due Date</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statements">
          {stmtLoading && <LoadingSkeleton rows={4} />}
          {stmtError && <ErrorState message="Failed to load statements" onRetry={refetchStmt} />}
          {statements && statements.length === 0 && (
            <EmptyState title="No statements" description="You don't have any statements yet." />
          )}
          {statements && statements.length > 0 && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Statement No</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Property</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Period</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((stmt) => (
                    <StatementRow key={stmt.id} statement={stmt} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
