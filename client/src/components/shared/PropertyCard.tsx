import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin } from 'lucide-react';
import type { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const outstandingCount = property.outstanding_invoice_count || 0;

  return (
    <Card className="transition-all hover:shadow-md hover:border-emerald-200 group">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 group-hover:bg-emerald-100 transition-colors">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{property.address_line1}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{property.city}, {property.postcode}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{property.property_type}</Badge>
          {outstandingCount > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
              {outstandingCount} outstanding
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => navigate(`/properties/${property.id}`)}
        >
          View Property
        </Button>
      </CardFooter>
    </Card>
  );
}
