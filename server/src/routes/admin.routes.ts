import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateServiceRequestSchema, updateUserSchema } from '../schemas/request.schema';
import { importDataSchema, ImportRow } from '../schemas/import.schema';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
  const search = (req.query.search as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('users')
    .select('id, email, role, is_active, created_at, updated_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }

  const { data: users, count, error } = await query;

  if (error) throw new AppError(500, 'Failed to fetch users');

  res.json({
    data: {
      users: users || [],
      total: count || 0,
      page,
      limit,
    },
  });
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', validate(updateUserSchema), async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { is_active } = req.body as { is_active: boolean };

  const { data: user, error } = await supabase
    .from('users')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error || !user) throw new AppError(404, 'User not found');

  res.json({ data: user });
});

// GET /api/admin/service-requests
router.get('/service-requests', async (req: Request, res: Response) => {
  const status = req.query.status as string;

  let query = supabase
    .from('service_requests')
    .select('*, users(email), properties(address_line1, city, postcode)')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: requests, error } = await query;

  if (error) throw new AppError(500, 'Failed to fetch requests');

  res.json({ data: requests || [] });
});

// PATCH /api/admin/service-requests/:id
router.patch(
  '/service-requests/:id',
  validate(updateServiceRequestSchema),
  async (req: Request, res: Response) => {
    const requestId = req.params.id;
    const { status } = req.body as { status: string };

    const { data: request, error } = await supabase
      .from('service_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single();

    if (error || !request) throw new AppError(404, 'Service request not found');

    res.json({ data: request });
  }
);

// POST /api/admin/import
router.post('/import', validate(importDataSchema), async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { filename, rows } = req.body as { filename: string; rows: ImportRow[] };

  // Create import record
  const { data: importRecord, error: importError } = await supabase
    .from('data_imports')
    .insert({
      tenant_id: tenantId,
      filename,
      imported_by: userId,
      status: 'pending',
      row_count: rows.length,
    })
    .select()
    .single();

  if (importError || !importRecord) throw new AppError(500, 'Failed to create import record');

  const errors: string[] = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    try {
      // Upsert property using external_ref as dedup key
      const { data: existingProp } = await supabase
        .from('properties')
        .select('id')
        .eq('external_ref', row.external_ref)
        .eq('tenant_id', tenantId)
        .single();

      let propertyId: string;

      if (existingProp) {
        const { data: updated } = await supabase
          .from('properties')
          .update({
            address_line1: row.address_line1,
            address_line2: row.address_line2 || null,
            city: row.city,
            postcode: row.postcode,
            property_type: row.property_type,
          })
          .eq('id', existingProp.id)
          .select()
          .single();
        propertyId = updated?.id || existingProp.id;
      } else {
        const { data: newProp, error: propError } = await supabase
          .from('properties')
          .insert({
            tenant_id: tenantId,
            external_ref: row.external_ref,
            address_line1: row.address_line1,
            address_line2: row.address_line2 || null,
            city: row.city,
            postcode: row.postcode,
            property_type: row.property_type,
          })
          .select()
          .single();

        if (propError || !newProp) {
          errors.push(`Row ${i + 1}: Failed to create property`);
          continue;
        }
        propertyId = newProp.id;
      }

      // Link customer if email provided
      if (row.customer_email) {
        const { data: customer } = await supabase
          .from('users')
          .select('id')
          .eq('email', row.customer_email.toLowerCase())
          .single();

        if (customer) {
          await supabase
            .from('user_properties')
            .upsert(
              { user_id: customer.id, property_id: propertyId },
              { onConflict: 'user_id,property_id' }
            );
        }
      }

      // Create invoice if data provided
      if (row.invoice_number && row.invoice_amount) {
        const { data: existingInv } = await supabase
          .from('invoices')
          .select('id')
          .eq('invoice_number', row.invoice_number)
          .eq('tenant_id', tenantId)
          .single();

        if (!existingInv) {
          await supabase.from('invoices').insert({
            tenant_id: tenantId,
            property_id: propertyId,
            invoice_number: row.invoice_number,
            issue_date: row.invoice_issue_date || new Date().toISOString().split('T')[0],
            due_date: row.invoice_due_date || new Date().toISOString().split('T')[0],
            amount: Number(row.invoice_amount),
            status: row.invoice_status || 'unpaid',
          });
        }
      }

      successCount++;
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  // Update import record
  const finalStatus = errors.length === 0 ? 'success' : (successCount > 0 ? 'success' : 'failed');
  await supabase
    .from('data_imports')
    .update({
      status: finalStatus,
      row_count: successCount,
      error_log: errors.length > 0 ? errors.join('\n') : null,
    })
    .eq('id', importRecord.id);

  res.status(201).json({
    data: {
      importId: importRecord.id,
      status: finalStatus,
      rowsImported: successCount,
      errors,
    },
  });
});

// GET /api/admin/imports — import history
router.get('/imports', async (req: Request, res: Response) => {
  const { data: imports, error } = await supabase
    .from('data_imports')
    .select('*, users(email)')
    .order('created_at', { ascending: false });

  if (error) throw new AppError(500, 'Failed to fetch imports');

  res.json({ data: imports || [] });
});

// GET /api/admin/stats — dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  const [customersRes, propertiesRes, requestsRes, importsRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'customer'),
    supabase.from('properties').select('id', { count: 'exact' }),
    supabase.from('service_requests').select('id', { count: 'exact' }).neq('status', 'resolved'),
    supabase.from('data_imports').select('id', { count: 'exact' }),
  ]);

  res.json({
    data: {
      totalCustomers: customersRes.count || 0,
      activeProperties: propertiesRes.count || 0,
      openRequests: requestsRes.count || 0,
      importsRun: importsRes.count || 0,
    },
  });
});

export default router;
