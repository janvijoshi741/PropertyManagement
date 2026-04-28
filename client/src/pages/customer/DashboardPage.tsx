import { useAuth } from '@/context/AuthContext';
import { useProperties } from '@/hooks/useProperties';
import { PropertyCard } from '@/components/shared/PropertyCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Building2, Wallet, ArrowUpRight } from 'lucide-react';
import { useAccountBalance } from '@/hooks/useBalance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: properties, isPending, isError, refetch } = useProperties();
  const { data: balance } = useAccountBalance();

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
          <p className="text-slate-500 mt-1">{user?.email}</p>
        </div>
        
        {balance && balance.totalOutstanding > 0 && (
          <Card className="bg-primary text-primary-foreground border-none sm:min-w-[240px]">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs opacity-80 uppercase font-semibold">Outstanding Balance</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-GB', { style: 'currency', currency: balance.currency }).format(balance.totalOutstanding)}
                  </p>
                </div>
              </div>
              <Link
                to="/documents"
                className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 h-7 gap-1 px-2.5 text-[0.8rem] hidden sm:flex bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Pay Now
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {isPending && <LoadingSkeleton type="card" rows={3} />}
      {isError && <ErrorState message="Failed to load properties" onRetry={refetch} />}
      {properties && properties.length === 0 && (
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-slate-400" />}
          title="No properties found"
          description="No properties have been linked to your account yet."
        />
      )}
      {properties && properties.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
