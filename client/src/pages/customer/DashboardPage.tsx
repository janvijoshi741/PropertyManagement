import { useAuth } from '@/context/AuthContext';
import { useProperties } from '@/hooks/useProperties';
import { PropertyCard } from '@/components/shared/PropertyCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Building2 } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: properties, isPending, isError, refetch } = useProperties();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
        <p className="text-slate-500 mt-1">{user?.email}</p>
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
