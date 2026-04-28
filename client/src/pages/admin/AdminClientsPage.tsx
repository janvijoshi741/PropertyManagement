import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Plus } from 'lucide-react';
import { adminApi } from '@/api/admin.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminClientsPage() {
  const queryClient = useQueryClient();
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['adminTenants'],
    queryFn: () => adminApi.getTenants(),
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => adminApi.createTenant(data.name, data.email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      toast.success('Client and admin user created successfully');
      setIsNewClientOpen(false);
      setNewClientName('');
      setNewClientEmail('');
    },
    onError: (error: Error) => {
      toast.error('Failed to create client', { description: error.message });
    },
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) return;
    createTenantMutation.mutate({ name: newClientName, email: newClientEmail });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-1">Manage client entities and their branding</p>
        </div>
        <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" /> Add Client
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Create a new business entity and its initial Admin user. They will log in using OTP.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Acme Properties"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  disabled={createTenantMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Admin Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="admin@client.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  disabled={createTenantMutation.isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createTenantMutation.isPending || !newClientName.trim() || !newClientEmail.trim()}>
                {createTenantMutation.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          tenants.map((tenant) => (
            <Card key={tenant.id} className="overflow-hidden flex flex-col border-primary/20">
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: tenant.primary_color || '#0f172a' }} 
              />
              <CardHeader className="pb-4 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {tenant.logo_url ? (
                      <img src={tenant.logo_url} alt="Logo" className="h-8 w-auto object-contain" />
                    ) : (
                      <Building2 className="h-8 w-8 text-slate-400" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl">{tenant.name}</CardTitle>
                <CardDescription className="line-clamp-1">
                  ID: {tenant.id.split('-')[0]}...
                </CardDescription>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


