import { useParams, useNavigate } from 'react-router-dom';
import { useProperty } from '@/hooks/useProperties';
import { usePropertyInvoices } from '@/hooks/useInvoices';
import { usePropertyStatements } from '@/hooks/useStatements';
import { useServiceRequests } from '@/hooks/useRequests';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Plus, Eye, Download, FileText, Receipt, MessageSquare } from 'lucide-react';
import type { RequestType } from '@/types';
import { REQUEST_TYPE_LABELS } from '@/types';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isPending: propLoading, isError: propError } = useProperty(id || '');
  const { data: invoices, isPending: invLoading } = usePropertyInvoices(id || '');
  const { data: statements, isPending: stmtLoading } = usePropertyStatements(id || '');
  const { data: allRequests } = useServiceRequests();

  const propertyRequests = (allRequests || []).filter((r) => r.property_id === id);

  if (propLoading) return <LoadingSkeleton type="detail" />;
  if (propError || !property) return <ErrorState message="Property not found" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{property.address_line1}</h1>
        <div className="flex items-center gap-2 mt-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">{property.city}</span>
          <Badge variant="outline">{property.postcode}</Badge>
          <Badge variant="secondary">{property.property_type}</Badge>
        </div>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="statements" className="gap-2">
            <FileText className="h-4 w-4" /> Statements
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          {invLoading && <LoadingSkeleton rows={3} />}
          {invoices && invoices.length === 0 && (
            <EmptyState title="No invoices" description="No invoices found for this property." />
          )}
          {invoices && invoices.length > 0 && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Invoice No</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Issue Date</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Due Date</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-sm">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{inv.issue_date}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{inv.due_date}</td>
                      <td className="py-3 px-4 text-sm font-medium">£{Number(inv.amount).toFixed(2)}</td>
                      <td className="py-3 px-4"><StatusBadge status={inv.status} /></td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/invoices/${inv.id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statements">
          {stmtLoading && <LoadingSkeleton rows={3} />}
          {statements && statements.length === 0 && (
            <EmptyState title="No statements" description="No statements found for this property." />
          )}
          {statements && statements.length > 0 && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Statement No</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Period</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map((stmt) => (
                    <tr key={stmt.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-sm">{stmt.statement_number}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {stmt.period_from} — {stmt.period_to}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">£{Number(stmt.amount).toFixed(2)}</td>
                      <td className="py-3 px-4 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/statements/${stmt.id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        {stmt.document_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={stmt.document_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => navigate(`/requests/new?propertyId=${id}`)}
            >
              <Plus className="h-4 w-4 mr-2" /> Submit New Request
            </Button>
          </div>
          {propertyRequests.length === 0 && (
            <EmptyState title="No requests" description="No service requests for this property." />
          )}
          {propertyRequests.length > 0 && (
            <div className="rounded-lg border bg-white overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Submitted</th>
                    <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyRequests.map((req) => (
                    <tr key={req.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">
                        {REQUEST_TYPE_LABELS[req.request_type as RequestType]}
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={req.status} /></td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-500 max-w-xs truncate">{req.notes}</td>
                    </tr>
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
