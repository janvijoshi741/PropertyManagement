import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProperties } from '@/hooks/useProperties';
import { useCreateRequest } from '@/hooks/useRequests';
import { newRequestSchema, type NewRequestFormData } from '@/schemas/request.schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(properties || []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.address_line1}, {p.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select request type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pet_request">Pet Request</SelectItem>
                        <SelectItem value="alteration_request">Alteration Request</SelectItem>
                        <SelectItem value="general_enquiry">General Enquiry</SelectItem>
                      </SelectContent>
                    </Select>
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
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
