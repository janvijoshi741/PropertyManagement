import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Users, Mail, Clock, Shield } from 'lucide-react';
import { settingsApi } from '@/api/settings.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerUsersPage() {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['tenantUsers'],
    queryFn: () => settingsApi.getUsers(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users</h1>
          <p className="text-slate-500 mt-1">Manage customers and agents associated with your account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all users linked to your properties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-slate-500" />
                            </div>
                            <span className="font-medium text-slate-900">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Shield className={`h-3.5 w-3.5 ${u.role === 'admin' ? 'text-indigo-500' : 'text-slate-400'}`} />
                            <span className={`capitalize ${u.role === 'admin' ? 'font-medium text-indigo-700' : 'text-slate-600'}`}>
                              {u.role === 'customer' ? 'Customer' : 'Admin'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            u.is_active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-slate-500 text-sm gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(u.created_at), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
