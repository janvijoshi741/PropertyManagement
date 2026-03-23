import { useNavigate } from 'react-router-dom';
import { useServiceRequests } from '@/hooks/useRequests';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { REQUEST_TYPE_LABELS, type RequestType } from '@/types';

export function RequestsPage() {
  const navigate = useNavigate();
  const { data: requests, isPending, isError, refetch } = useServiceRequests();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Requests</h1>
          <p className="text-slate-500 mt-1">Track your service requests</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/requests/new')}>
          <Plus className="h-4 w-4 mr-2" /> New Request
        </Button>
      </div>

      {isPending && <LoadingSkeleton rows={4} />}
      {isError && <ErrorState message="Failed to load requests" onRetry={refetch} />}
      {requests && requests.length === 0 && (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8 text-slate-400" />}
          title="No requests yet"
          description="Submit a request to get started."
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/requests/new')}>
              <Plus className="h-4 w-4 mr-2" /> Submit Request
            </Button>
          }
        />
      )}
      {requests && requests.length > 0 && (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Property</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Submitted</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Notes</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">
                    {req.properties?.address_line1 || '-'}
                  </td>
                  <td className="py-3 px-4 text-sm">
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
    </div>
  );
}
