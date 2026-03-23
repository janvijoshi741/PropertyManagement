import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createServiceRequestSchema } from '../schemas/request.schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All customer routes require authentication
router.use(requireAuth);

// GET /api/me
router.get('/me', (req: Request, res: Response) => {
  res.json({ data: req.user });
});

// GET /api/properties
router.get('/properties', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: userProperties, error } = await supabase
    .from('user_properties')
    .select('property_id')
    .eq('user_id', userId);

  if (error) throw new AppError(500, 'Failed to fetch properties');

  const propertyIds = (userProperties || []).map((up) => up.property_id);

  if (propertyIds.length === 0) {
    res.json({ data: [] });
    return;
  }

  const { data: properties } = await supabase
    .from('properties')
    .select('*')
    .in('id', propertyIds)
    .order('created_at', { ascending: false });

  // Get unpaid/overdue invoice counts per property
  const { data: invoiceCounts } = await supabase
    .from('invoices')
    .select('property_id, status')
    .in('property_id', propertyIds)
    .in('status', ['unpaid', 'overdue']);

  const countMap: Record<string, number> = {};
  (invoiceCounts || []).forEach((inv) => {
    countMap[inv.property_id] = (countMap[inv.property_id] || 0) + 1;
  });

  const propertiesWithCounts = (properties || []).map((p) => ({
    ...p,
    outstanding_invoice_count: countMap[p.id] || 0,
  }));

  res.json({ data: propertiesWithCounts });
});

// GET /api/properties/:id
router.get('/properties/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const propertyId = req.params.id;

  // Verify user has access
  const { data: link } = await supabase
    .from('user_properties')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single();

  if (!link) throw new AppError(404, 'Property not found');

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single();

  if (!property) throw new AppError(404, 'Property not found');

  res.json({ data: property });
});

// GET /api/properties/:id/invoices
router.get('/properties/:id/invoices', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const propertyId = req.params.id;

  // Verify access
  const { data: link } = await supabase
    .from('user_properties')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single();

  if (!link) throw new AppError(404, 'Property not found');

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('property_id', propertyId)
    .order('issue_date', { ascending: false });

  res.json({ data: invoices || [] });
});

// GET /api/properties/:id/statements
router.get('/properties/:id/statements', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const propertyId = req.params.id;

  const { data: link } = await supabase
    .from('user_properties')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single();

  if (!link) throw new AppError(404, 'Property not found');

  const { data: statements } = await supabase
    .from('statements')
    .select('*')
    .eq('property_id', propertyId)
    .order('period_from', { ascending: false });

  res.json({ data: statements || [] });
});

// GET /api/invoices/:id
router.get('/invoices/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const invoiceId = req.params.id;

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, properties(*)')
    .eq('id', invoiceId)
    .single();

  if (!invoice) throw new AppError(404, 'Invoice not found');

  // Verify user has access to this property
  const { data: link } = await supabase
    .from('user_properties')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', invoice.property_id)
    .single();

  if (!link) throw new AppError(404, 'Invoice not found');

  res.json({ data: invoice });
});

// GET /api/statements/:id
router.get('/statements/:id', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const statementId = req.params.id;

  const { data: statement } = await supabase
    .from('statements')
    .select('*, properties(*)')
    .eq('id', statementId)
    .single();

  if (!statement) throw new AppError(404, 'Statement not found');

  const { data: link } = await supabase
    .from('user_properties')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', statement.property_id)
    .single();

  if (!link) throw new AppError(404, 'Statement not found');

  res.json({ data: statement });
});

// GET /api/service-requests
router.get('/service-requests', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: requests } = await supabase
    .from('service_requests')
    .select('*, properties(address_line1, city, postcode)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  res.json({ data: requests || [] });
});

// POST /api/service-requests
router.post('/service-requests', validate(createServiceRequestSchema), async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { propertyId, requestType, notes } = req.body as {
    propertyId: string;
    requestType: string;
    notes: string;
  };

  // Verify user has access to property
  const { data: link } = await supabase
    .from('user_properties')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .single();

  if (!link) throw new AppError(404, 'Property not found');

  const { data: request, error } = await supabase
    .from('service_requests')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      property_id: propertyId,
      request_type: requestType,
      status: 'submitted',
      notes,
    })
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to create request');

  res.status(201).json({ data: request });
});

// GET /api/documents/invoices — all invoices across user's properties
router.get('/documents/invoices', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: userProperties } = await supabase
    .from('user_properties')
    .select('property_id')
    .eq('user_id', userId);

  const propertyIds = (userProperties || []).map((up) => up.property_id);

  if (propertyIds.length === 0) {
    res.json({ data: [] });
    return;
  }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, properties(address_line1, city, postcode)')
    .in('property_id', propertyIds)
    .order('issue_date', { ascending: false });

  res.json({ data: invoices || [] });
});

// GET /api/documents/statements — all statements across user's properties
router.get('/documents/statements', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: userProperties } = await supabase
    .from('user_properties')
    .select('property_id')
    .eq('user_id', userId);

  const propertyIds = (userProperties || []).map((up) => up.property_id);

  if (propertyIds.length === 0) {
    res.json({ data: [] });
    return;
  }

  const { data: statements } = await supabase
    .from('statements')
    .select('*, properties(address_line1, city, postcode)')
    .in('property_id', propertyIds)
    .order('period_from', { ascending: false });

  res.json({ data: statements || [] });
});

export default router;
