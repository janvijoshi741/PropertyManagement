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
          <Button variant="ghost" size="sm" asChild className="ml-1">
            <a href={statement.document_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
      </td>
    </tr>
  );
}
