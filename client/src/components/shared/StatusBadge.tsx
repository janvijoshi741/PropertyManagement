import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 'unpaid' | 'paid' | 'overdue' | 'submitted' | 'in_review' | 'resolved' | 'pending' | 'success' | 'failed' | 'active' | 'inactive';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  unpaid: { label: 'Unpaid', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-700 border-red-200' },
  submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_review: { label: 'In Review', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolved: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  success: { label: 'Success', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  inactive: { label: 'Inactive', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn(config.className, 'font-medium', className)}>
      {config.label}
    </Badge>
  );
}
