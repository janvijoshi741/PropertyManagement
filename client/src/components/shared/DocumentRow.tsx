import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';
import type { Invoice, Statement } from '@/types';

interface InvoiceRowProps {
  invoice: Invoice;
}

export function InvoiceRow({ invoice }: InvoiceRowProps) {
  const navigate = useNavigate();
  return (
    <tr className="border-b hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 font-medium text-sm">{invoice.invoice_number}</td>
      <td className="py-3 px-4 text-sm text-slate-600">
        {invoice.properties?.address_line1 || '-'}
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">{invoice.issue_date}</td>
      <td className="py-3 px-4 text-sm text-slate-600">{invoice.due_date}</td>
      <td className="py-3 px-4 text-sm font-medium">£{Number(invoice.amount).toFixed(2)}</td>
      <td className="py-3 px-4"><StatusBadge status={invoice.status} /></td>
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/invoices/${invoice.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
      </td>
    </tr>
  );
}

interface StatementRowProps {
  statement: Statement;
}

export function StatementRow({ statement }: StatementRowProps) {
  const navigate = useNavigate();
  return (
    <tr className="border-b hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 font-medium text-sm">{statement.statement_number}</td>
      <td className="py-3 px-4 text-sm text-slate-600">
        {statement.properties?.address_line1 || '-'}
      </td>
      <td className="py-3 px-4 text-sm text-slate-600">
        {statement.period_from} — {statement.period_to}
      </td>
      <td className="py-3 px-4 text-sm font-medium">£{Number(statement.amount).toFixed(2)}</td>
      <td className="py-3 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/statements/${statement.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
        {statement.document_url && (
          <a
            href={statement.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 h-7 gap-1 px-2.5 text-[0.8rem] ml-1 hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" />
          </a>
        )}
      </td>
    </tr>
  );
}
