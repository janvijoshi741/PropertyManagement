import { useAdminStats, useAdminServiceRequests } from '@/hooks/useAdmin';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, MessageSquare, Upload } from 'lucide-react';
import { REQUEST_TYPE_LABELS, type RequestType } from '@/types';

export function AdminDashboardPage() {
  const { data: stats, isPending: statsLoading, isError: statsError, refetch } = useAdminStats();
  const { data: requests } = useAdminServiceRequests();

  const recentRequests = (requests || []).slice(0, 10);

  if (statsLoading) return <LoadingSkeleton type="card" rows={4} />;
  if (statsError) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;

  const statCards = [
    { label: 'Total Customers', value: stats?.totalCustomers || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Properties', value: stats?.activeProperties || 0, icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Open Requests', value: stats?.openRequests || 0, icon: MessageSquare, color: 'bg-amber-50 text-amber-600' },
    { label: 'Imports Run', value: stats?.importsRun || 0, icon: Upload, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your property management portal</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No recent requests</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Property</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="py-2 px-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="border-b hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-sm">{req.users?.email || '-'}</td>
                      <td className="py-2.5 px-3 text-sm text-slate-600">{req.properties?.address_line1 || '-'}</td>
                      <td className="py-2.5 px-3 text-sm">{REQUEST_TYPE_LABELS[req.request_type as RequestType]}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={req.status} /></td>
                      <td className="py-2.5 px-3 text-sm text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
