import { useParams } from 'react-router-dom';
import { useInvoice } from '@/hooks/useInvoices';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorState } from '@/components/shared/ErrorState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Download, Building, Info } from 'lucide-react';

const BLINK_URL = import.meta.env.VITE_BLINK_PAYMENT_URL || 'https://secure.blinkpayment.co.uk';
const BANK_ACCOUNT_NAME = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'PropertyPortal Ltd';
const BANK_SORT_CODE = import.meta.env.VITE_BANK_SORT_CODE || '00-00-00';
const BANK_ACCOUNT_NUMBER = import.meta.env.VITE_BANK_ACCOUNT_NUMBER || '00000000';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isPending, isError, refetch } = useInvoice(id || '');

  if (isPending) return <LoadingSkeleton type="detail" />;
  if (isError || !invoice) return <ErrorState message="Invoice not found" onRetry={refetch} />;

  const amount = Number(invoice.amount);
  const isPaid = invoice.status === 'paid';
  const isPayable = !isPaid && amount >= 50;
  const showBankTransfer = !isPaid && amount < 50;
  const blinkUrl = `${BLINK_URL}?amount=${amount}&ref=${invoice.invoice_number}`;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Invoice {invoice.invoice_number}</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Invoice Details</CardTitle>
            <StatusBadge status={invoice.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.properties && (
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">
                {invoice.properties.address_line1}, {invoice.properties.city}, {invoice.properties.postcode}
              </span>
            </div>
          )}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Invoice Number</p>
              <p className="font-medium">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="text-xl font-bold text-slate-800">£{amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500">Issue Date</p>
              <p className="font-medium">{invoice.issue_date}</p>
            </div>
            <div>
              <p className="text-slate-500">Due Date</p>
              <p className="font-medium">{invoice.due_date}</p>
            </div>
          </div>
          <Separator />

          {/* Payment actions */}
          {isPaid && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <StatusBadge status="paid" className="text-base px-4 py-1" />
              <p className="text-sm text-emerald-700 mt-2">This invoice has been paid in full.</p>
            </div>
          )}

          {isPayable && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
              >
                <a href={blinkUrl} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="h-5 w-5 mr-2" /> Pay Now — £{amount.toFixed(2)}
                </a>
              </Button>
              <Button variant="outline" className="flex-1 h-12" >
                <a href={invoice.document_url || '#'} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" /> Download Invoice
                </a>
              </Button>
            </div>
          )}

          {showBankTransfer && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-5">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Bank Transfer Instructions</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    For amounts under £50, please pay via bank transfer using the details below.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Account Name</span>
                      <span className="font-medium text-blue-800">{BANK_ACCOUNT_NAME}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Sort Code</span>
                      <span className="font-medium text-blue-800">{BANK_SORT_CODE}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Account Number</span>
                      <span className="font-medium text-blue-800">{BANK_ACCOUNT_NUMBER}</span>
                    </div>
                    <Separator className="bg-blue-200" />
                    <div className="flex justify-between">
                      <span className="text-blue-600">Payment Reference</span>
                      <span className="font-bold text-blue-800">{invoice.invoice_number}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
