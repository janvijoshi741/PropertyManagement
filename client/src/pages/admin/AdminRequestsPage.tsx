import { useState } from 'react';
import { useAdminServiceRequests, useUpdateRequestStatus } from '@/hooks/useAdmin';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare } from 'lucide-react';
import { REQUEST_TYPE_LABELS, type RequestType, type ServiceRequest } from '@/types';

export function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateDialog, setUpdateDialog] = useState<{ open: boolean; request: ServiceRequest | null }>({
    open: false,
    request: null,
  });
  const [newStatus, setNewStatus] = useState('');

  const { data: requests, isPending, isError, refetch } = useAdminServiceRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const updateStatus = useUpdateRequestStatus();

  const handleUpdateStatus = () => {
    if (updateDialog.request && newStatus) {
      updateStatus.mutate(
        { id: updateDialog.request.id, status: newStatus as any },
        { onSuccess: () => setUpdateDialog({ open: false, request: null }) }
      );
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Service Requests</h1>
        <p className="text-slate-500 mt-1">Manage customer service requests</p>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="in_review">In Review</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {isPending && <LoadingSkeleton rows={5} />}
      {isError && <ErrorState message="Failed to load requests" onRetry={refetch} />}
      {requests && requests.length === 0 && (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8 text-slate-400" />}
          title="No requests"
          description="No service requests match the current filter."
        />
      )}
      {requests && requests.length > 0 && (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Customer</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Property</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Submitted</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm">{req.users?.email || '-'}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{req.properties?.address_line1 || '-'}</td>
                  <td className="py-3 px-4 text-sm">{REQUEST_TYPE_LABELS[req.request_type as RequestType]}</td>
                  <td className="py-3 px-4"><StatusBadge status={req.status} /></td>
                  <td className="py-3 px-4 text-sm text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewStatus(req.status);
                        setUpdateDialog({ open: true, request: req });
                      }}
                    >
                      Update Status
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={updateDialog.open} onOpenChange={(open) => setUpdateDialog({ open, request: updateDialog.request })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Request Status</DialogTitle>
          </DialogHeader>
          <Select value={newStatus} onValueChange={(val: any) => setNewStatus(val || '')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialog({ open: false, request: null })}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleUpdateStatus}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
