import { useState } from 'react';
import { useAdminUsers, useToggleUser } from '@/hooks/useAdmin';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users } from 'lucide-react';
import type { AdminUser } from '@/types';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  });
  const { data, isPending, isError, refetch } = useAdminUsers(search);
  const toggleUser = useToggleUser();

  const handleToggle = (user: AdminUser) => {
    if (user.is_active) {
      setConfirmDialog({ open: true, user });
    } else {
      toggleUser.mutate({ id: user.id, isActive: true });
    }
  };

  const confirmDeactivate = () => {
    if (confirmDialog.user) {
      toggleUser.mutate({ id: confirmDialog.user.id, isActive: false });
    }
    setConfirmDialog({ open: false, user: null });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <p className="text-slate-500 mt-1">Manage customer and admin accounts</p>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isPending && <LoadingSkeleton rows={5} />}
      {isError && <ErrorState message="Failed to load users" onRetry={refetch} />}
      {data && data.users.length === 0 && (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-400" />}
          title="No users found"
          description={search ? 'Try a different search term.' : 'No users in the system.'}
        />
      )}
      {data && data.users.length > 0 && (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Created</th>
                <th className="py-3 px-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant={user.is_active ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggle(user)}
                      disabled={toggleUser.isPending}
                      className={user.is_active ? '' : 'bg-emerald-600 hover:bg-emerald-700'}
                    >
                      {user.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, user: confirmDialog.user })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate <strong>{confirmDialog.user?.email}</strong>?
              They will no longer be able to log in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
