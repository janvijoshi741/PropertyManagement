import { Router, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  updateServiceRequestSchema,
  updateUserSchema,
} from "../schemas/request.schema";
import { importDataSchema } from "../schemas/import.schema";
import { supabase } from "../config/supabase";
import type { ImportRow } from "../schemas/import.schema";
import { AuditService } from "../services/audit.service";

const router = Router();

// All admin routes require admin authentication
router.use(requireAdmin);

// GET /api/admin/stats
router.get("/stats", async (req: Request, res: Response) => {
  const targetTenantId = req.query.tenantId as string;

  let usersQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer")
      .eq("is_active", true);
  
  let propertiesQuery = supabase
      .from("properties")
      .select("*", { count: "exact", head: true });
      
  let requestsQuery = supabase
      .from("service_requests")
      .select("*", { count: "exact", head: true })
      .neq("status", "resolved");
      
  let importsQuery = supabase
      .from("data_imports")
      .select("*", { count: "exact", head: true });

  if (targetTenantId) {
    usersQuery = usersQuery.eq("tenant_id", targetTenantId);
    propertiesQuery = propertiesQuery.eq("tenant_id", targetTenantId);
    requestsQuery = requestsQuery.eq("tenant_id", targetTenantId);
    importsQuery = importsQuery.eq("tenant_id", targetTenantId);
  }

  const [
    { count: totalCustomers },
    { count: activeProperties },
    { count: openRequests },
    { count: importsRun },
  ] = await Promise.all([
    usersQuery,
    propertiesQuery,
    requestsQuery,
    importsQuery
  ]);

  res.json({
    data: {
      totalCustomers: totalCustomers ?? 0,
      activeProperties: activeProperties ?? 0,
      openRequests: openRequests ?? 0,
      importsRun: importsRun ?? 0,
    },
  });
});

// GET /api/admin/users
router.get("/users", async (req: Request, res: Response) => {
  const targetTenantId = req.query.tenantId as string;
  const search = ((req.query.search as string) || "").toLowerCase();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("users")
    .select("id, email, role, is_active, created_at, updated_at, tenant_id", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (targetTenantId) {
    query = query.eq("tenant_id", targetTenantId);
  }

  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    res.status(500).json({ error: "Failed to fetch users" });
    return;
  }

  res.json({
    data: {
      users: data || [],
      total: count ?? 0,
      page,
      limit,
    },
  });
});

// PATCH /api/admin/users/:id
router.patch(
  "/users/:id",
  validate(updateUserSchema),
  async (req: Request, res: Response) => {
    const { is_active } = req.body as { is_active: boolean };

    const { data, error } = await supabase
      .from("users")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("id, email, role, is_active, created_at, updated_at")
      .single();

    if (error || !data) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Audit log
    await AuditService.log({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      action: "update_user_status",
      resourceType: "user",
      resourceId: data.id,
      changes: { is_active },
    });

    res.json({ data });
  },
);

// GET /api/admin/service-requests
router.get("/service-requests", async (req: Request, res: Response) => {
  const targetTenantId = req.query.tenantId as string;
  const status = req.query.status as string;

  let query = supabase
    .from("service_requests")
    .select("*, users(email), properties(address_line1, city, postcode)")
    .order("created_at", { ascending: false });

  if (targetTenantId) {
    query = query.eq("tenant_id", targetTenantId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: "Failed to fetch service requests" });
    return;
  }

  res.json({ data: data || [] });
});

// PATCH /api/admin/service-requests/:id
router.patch(
  "/service-requests/:id",
  validate(updateServiceRequestSchema),
  async (req: Request, res: Response) => {
    const { status } = req.body as { status: string };

    const { data, error } = await supabase
      .from("service_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*, users(email), properties(address_line1, city, postcode)")
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Service request not found" });
      return;
    }

    // Audit log
    await AuditService.log({
      tenantId: req.user!.tenantId,
      userId: req.user!.userId,
      action: "update_request_status",
      resourceType: "service_request",
      resourceId: data.id,
      changes: { status },
    });

    res.json({ data });
  },
);

// POST /api/admin/import
router.post(
  "/import",
  validate(importDataSchema),
  async (req: Request, res: Response) => {
    const { filename, targetTenantId, rows } = req.body as {
      filename: string;
      targetTenantId: string;
      rows: ImportRow[];
    };
    
    if (!targetTenantId) {
      res.status(400).json({ error: "targetTenantId is required" });
      return;
    }
    
    const tenantId = targetTenantId;
    const adminId = req.user!.userId;
    const errors: string[] = [];
    let rowsImported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Upsert property by external_ref (select first, then insert or update)
        const { data: existingProp } = await supabase
          .from("properties")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("external_ref", row.external_ref)
          .single();

        let propertyId: string;
        if (existingProp) {
          await supabase
            .from("properties")
            .update({
              address_line1: row.address_line1,
              address_line2: row.address_line2 || null,
              city: row.city,
              postcode: row.postcode,
              property_type: row.property_type,
            })
            .eq("id", existingProp.id);
          propertyId = existingProp.id;
        } else {
          const { data: newProp, error: propError } = await supabase
            .from("properties")
            .insert({
              tenant_id: tenantId,
              external_ref: row.external_ref,
              address_line1: row.address_line1,
              address_line2: row.address_line2 || null,
              city: row.city,
              postcode: row.postcode,
              property_type: row.property_type,
            })
            .select("id")
            .single();

          if (propError || !newProp) {
            errors.push(
              `Row ${i + 1}: Failed to insert property — ${propError?.message}`,
            );
            continue;
          }
          propertyId = newProp.id;
        }

        const property = { id: propertyId };

        // Link customer if email provided
        if (row.customer_email) {
          const email = row.customer_email.toLowerCase();
          let { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .eq("tenant_id", tenantId)
            .single();

          // Create user if not found
          if (!user) {
            const { data: newUser, error: createError } = await supabase
              .from("users")
              .insert({
                email,
                tenant_id: tenantId,
                role: "customer",
                is_active: true,
              })
              .select("id")
              .single();

            if (!createError && newUser) {
              user = newUser;
            }
          }

          if (user) {
            await supabase.from("user_properties").upsert(
              { user_id: user.id, property_id: property.id },
              { onConflict: "user_id,property_id" },
            );
          }
        }

        // Insert invoice if provided
        if (
          row.invoice_number &&
          row.invoice_amount != null &&
          row.invoice_issue_date &&
          row.invoice_due_date
        ) {
          const { data: existingInv } = await supabase
            .from("invoices")
            .select("id")
            .eq("invoice_number", row.invoice_number)
            .eq("tenant_id", tenantId)
            .single();

          if (!existingInv) {
            const { error: invError } = await supabase.from("invoices").insert({
              tenant_id: tenantId,
              property_id: property.id,
              invoice_number: row.invoice_number,
              issue_date: row.invoice_issue_date,
              due_date: row.invoice_due_date,
              amount: Number(row.invoice_amount),
              status: row.invoice_status || "unpaid",
            });
            if (invError) {
              errors.push(
                `Row ${i + 1}: Invoice insert failed — ${invError.message}`,
              );
            }
          }
        }

        rowsImported++;
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    // Record the import
    const { data: importRecord } = await supabase
      .from("data_imports")
      .insert({
        tenant_id: tenantId,
        filename,
        imported_by: adminId,
        status: errors.length === 0 ? "success" : "failed",
        row_count: rowsImported,
        error_log: errors.length > 0 ? errors.join("\n") : null,
      })
      .select("id")
      .single();

    res.status(201).json({
      data: {
        importId: importRecord?.id,
        status: errors.length === 0 ? "success" : "partial",
        rowsImported,
        errors,
      },
    });

    // Audit log
    await AuditService.log({
      tenantId: tenantId,
      userId: adminId,
      action: "data_import",
      resourceType: "data_import",
      resourceId: importRecord?.id,
      changes: { filename, rowsImported, errorCount: errors.length },
    });
  },
);

// GET /api/admin/imports
router.get("/imports", async (req: Request, res: Response) => {
  const targetTenantId = req.query.tenantId as string;

  let query = supabase
    .from("data_imports")
    .select("*, users(email)")
    .order("created_at", { ascending: false });

  if (targetTenantId) {
    query = query.eq("tenant_id", targetTenantId);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: "Failed to fetch imports" });
    return;
  }

  res.json({ data: data || [] });
});

// GET /api/admin/audit-logs
router.get("/audit-logs", async (req: Request, res: Response) => {
  const targetTenantId = req.query.tenantId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("audit_logs")
    .select("*, users(email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (targetTenantId) {
    query = query.eq("tenant_id", targetTenantId);
  }

  const { data, error, count } = await query;

  if (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
    return;
  }

  res.json({
    data: {
      logs: data || [],
      total: count ?? 0,
      page,
      limit,
    },
  });
});

// GET /api/admin/tenants
router.get("/tenants", async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("name");

  if (error) {
    res.status(500).json({ error: "Failed to fetch tenants" });
    return;
  }

  res.json({ data: data || [] });
});

// POST /api/admin/tenants
router.post("/tenants", async (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: "Name and Email are required" });
    return;
  }

  // 1. Create Tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name })
    .select()
    .single();

  if (tenantError || !tenant) {
    res.status(500).json({ error: "Failed to create tenant" });
    return;
  }

  // 2. Create Initial Admin User
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      tenant_id: tenant.id,
      email: email.toLowerCase(),
      role: 'admin',
      is_active: true
    })
    .select()
    .single();

  if (userError || !user) {
    // Ideally we should rollback the tenant creation here, but ignoring for simplicity
    res.status(500).json({ error: "Failed to create admin user for the tenant" });
    return;
  }

  // Audit log
  await AuditService.log({
    tenantId: tenant.id,
    userId: req.user!.userId,
    action: "create_tenant",
    resourceType: "tenant",
    resourceId: tenant.id,
    changes: { name, email },
  });

  res.status(201).json({ data: tenant });
});

// PATCH /api/admin/tenants/:id/config
router.patch("/tenants/:id/config", async (req: Request, res: Response) => {
  const tenantId = req.params.id as string;
  const updates = req.body;

  // List of allowed fields to update
  const allowedFields = [
    "name",
    "logo_url",
    "primary_color",
    "secondary_color",
    "font_family",
    "min_payment_amount",
    "max_payment_amount",
    "bank_account_name",
    "bank_sort_code",
    "bank_account_number",
  ];

  const filteredUpdates: any = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const { data, error } = await supabase
    .from("tenants")
    .update(filteredUpdates)
    .eq("id", tenantId)
    .select()
    .single();

  if (error || !data) {
    res.status(500).json({ error: "Failed to update tenant configuration" });
    return;
  }

  // Audit log
  await AuditService.log({
    tenantId: tenantId,
    userId: req.user!.userId,
    action: "update_tenant_config",
    resourceType: "tenant",
    resourceId: tenantId,
    changes: filteredUpdates,
  });

  res.json({ data });
});

export default router;
