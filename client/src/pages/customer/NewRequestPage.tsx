import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProperties } from '@/hooks/useProperties';
import { useCreateRequest } from '@/hooks/useRequests';
import { newRequestSchema, type NewRequestFormData } from '@/schemas/request.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

const REQUEST_TYPES = [
  { value: 'pet_request', label: 'Pet Request' },
  { value: 'alteration_request', label: 'Alteration Request' },
  { value: 'general_enquiry', label: 'General Enquiry' },
];

export function NewRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProperty = searchParams.get('propertyId') || '';
  const { data: properties, isPending: propsLoading } = useProperties();
  const createRequest = useCreateRequest();

  const form = useForm<NewRequestFormData>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      propertyId: preselectedProperty,
      requestType: undefined,
      notes: '',
    },
  });

  const notesValue = form.watch('notes');

  const onSubmit = (data: NewRequestFormData) => {
    createRequest.mutate(data, {
      onSuccess: () => navigate('/requests'),
    });
  };

  if (propsLoading) return <LoadingSkeleton type="detail" />;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Submit New Request</h1>
        <p className="text-slate-500 mt-1">Tell us how we can help</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a property</option>
                        {(properties || []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.address_line1}, {p.city} — {p.postcode}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Type</FormLabel>
                    <FormControl>
                      <select
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select request type</option>
                        {REQUEST_TYPES.map((rt) => (
                          <option key={rt.value} value={rt.value}>
                            {rt.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about your request (minimum 10 characters)..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between">
                      <FormMessage />
                      <span className="text-xs text-slate-400">{notesValue.length} characters</span>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={createRequest.isPending}
                >
                  {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
