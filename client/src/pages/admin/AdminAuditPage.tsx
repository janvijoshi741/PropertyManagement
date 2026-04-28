import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/apiClient';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes: any;
  created_at: string;
  users: {
    email: string;
  };
}

export function AdminAuditPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['adminAuditLogs'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/audit-logs');
      return response.data.data.logs as AuditLog[];
    },
  });

  if (isPending) return <LoadingSkeleton type="table" rows={10} />;
  if (isError) return <ErrorState message="Failed to load audit logs" onRetry={refetch} />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
        <p className="text-slate-500 mt-1">History of actions performed in the portal</p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-slate-400" />
            System Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Resource</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">No activity recorded yet</td>
                  </tr>
                ) : (
                  data.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {log.users?.email || 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {log.resource_type} ({log.resource_id?.slice(0, 8)})
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-600" title={JSON.stringify(log.changes)}>
                          {JSON.stringify(log.changes)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
