import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { supabase } from "../config/supabase";
import { AuditService } from "../services/audit.service";
import { validate } from "../middleware/validate";
import { importDataSchema, type ImportRow } from "../schemas/import.schema";

const router = Router();

// All customer routes require authentication
router.use(requireAuth);

//ROUTES

// GET /api/me
router.get("/me", (req: Request, res: Response) => {
  res.json({ data: req.user });
});

// GET /api/tenant-branding
router.get("/tenant-branding", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  // Handle Master Admin (tenant-less) branding
  if (!tenantId) {
    res.json({
      data: {
        name: "Property Management Portal",
        logo_url: "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg", // Fallback to a clean icon
        primary_color: "#0F172A", // Classic Navy Blue
        secondary_color: "#1E293B",
        font_family: "Inter"
      }
    });
    return;
  }

  // Fetch tenant branding
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("name, logo_url, primary_color, secondary_color, font_family")
    .eq("id", tenantId)
    .single();

  if (tenantError || !tenant) {
    // Fallback to system branding instead of 404
    res.json({
      data: {
        name: "Property Management Portal",
        logo_url: "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg",
        primary_color: "#0F172A", 
        secondary_color: "#1E293B",
        font_family: "Inter"
      }
    });
    return;
  }

  res.json({ data: tenant });
});

// PATCH /api/me/tenant-config
router.patch("/me/tenant-config", async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: "Only admins can update tenant config" });
    return;
  }

  const tenantId = req.user!.tenantId;
  const updates = req.body;

  const allowedFields = ["logo_url", "primary_color", "secondary_color", "font_family"];
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
    res.status(500).json({ error: "Failed to update branding" });
    return;
  }

  await AuditService.log({
    tenantId,
    userId: req.user!.userId,
    action: "update_tenant_config",
    resourceType: "tenant",
    resourceId: tenantId,
    changes: filteredUpdates,
  });

  res.json({ data });
});

// GET /api/me/users
router.get("/me/users", async (req: Request, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ error: "Only admins can view users" });
    return;
  }

  const tenantId = req.user!.tenantId;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, is_active, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to fetch users" });
    return;
  }

  res.json({ data: data || [] });
});

// POST /api/me/import
router.post(
  "/me/import",
  validate(importDataSchema),
  async (req: Request, res: Response) => {
    if (req.user!.role !== 'admin') {
      res.status(403).json({ error: "Only admins can import data" });
      return;
    }

    const { filename, rows } = req.body as {
      filename: string;
      rows: ImportRow[];
    };
    const tenantId = req.user!.tenantId;
    const adminId = req.user!.userId;
    const errors: string[] = [];
    let rowsImported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
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
            .select()
            .single();

          if (propError || !newProp) throw new Error("Failed to create property");
          propertyId = newProp.id;
        }

        if (row.customer_email) {
          const email = row.customer_email.toLowerCase();
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

          let userId: string;
          if (existingUser) {
            userId = existingUser.id;
            // Optionally update name if provided
            if (row.customer_name) {
              await supabase
                .from("users")
                .update({ full_name: row.customer_name })
                .eq("id", userId);
            }
          } else {
            const { data: newUser, error: userError } = await supabase
              .from("users")
              .insert({
                tenant_id: tenantId,
                email,
                full_name: row.customer_name || null,
                role: "customer",
                is_active: true,
              })
              .select()
              .single();

            if (userError || !newUser) throw new Error("Failed to create user");
            userId = newUser.id;
          }

          const { data: linkExists } = await supabase
            .from("user_properties")
            .select("id")
            .eq("user_id", userId)
            .eq("property_id", propertyId)
            .single();

          if (!linkExists) {
            await supabase.from("user_properties").insert({
              user_id: userId,
              property_id: propertyId,
            });
          }
        }

        if (row.invoice_number && row.invoice_amount && row.invoice_issue_date && row.invoice_due_date) {
          const { data: existingInvoice } = await supabase
            .from("invoices")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("invoice_number", row.invoice_number)
            .single();

          if (!existingInvoice) {
            await supabase.from("invoices").insert({
              tenant_id: tenantId,
              property_id: propertyId,
              invoice_number: row.invoice_number,
              amount: Number(row.invoice_amount),
              status: row.invoice_status || "unpaid",
              issue_date: row.invoice_issue_date,
              due_date: row.invoice_due_date,
            });
          }
        }

        rowsImported++;
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${row.external_ref}): ${err.message || "Unknown error"}`);
      }
    }

    const status = errors.length > 0 && rowsImported === 0 ? "failed" : "success";

    const { data: importRecord } = await supabase
      .from("data_imports")
      .insert({
        tenant_id: tenantId,
        filename,
        imported_by: adminId,
        status,
        row_count: rowsImported,
        error_log: errors.length > 0 ? JSON.stringify(errors) : null,
      })
      .select()
      .single();

    if (importRecord) {
      await AuditService.log({
        tenantId,
        userId: adminId,
        action: "data_import",
        resourceType: "import",
        resourceId: importRecord.id,
        changes: { filename, rowsImported, errorCount: errors.length },
      });
    }

    res.json({
      data: {
        importId: importRecord?.id,
        status,
        rowsImported,
        errors,
      },
    });
  }
);

// GET /api/properties — only properties linked to this user
router.get("/properties", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // Step 1: Get property IDs linked to this user
  const { data: links, error: linksError } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId);

  if (linksError) {
    console.error("user_properties query failed:", linksError);
    res.status(500).json({ error: "Failed to fetch properties" });
    return;
  }

  const propertyIds = (links || []).map((l: any) => l.property_id);
  if (propertyIds.length === 0) {
    res.json({ data: [] });
    return;
  }

  // Step 2: Fetch full property details
  const { data: properties, error: propsError } = await supabase
    .from("properties")
    .select("*")
    .in("id", propertyIds);

  if (propsError) {
    console.error("properties query failed:", propsError);
    res.status(500).json({ error: "Failed to fetch properties" });
    return;
  }

  // Step 3: Get outstanding invoice counts
  const { data: invoiceCounts } = await supabase
    .from("invoices")
    .select("property_id")
    .in("property_id", propertyIds)
    .in("status", ["unpaid", "overdue"]);

  const countMap: Record<string, number> = {};
  (invoiceCounts || []).forEach((inv: any) => {
    countMap[inv.property_id] = (countMap[inv.property_id] || 0) + 1;
  });

  const result = (properties || []).map((p: any) => ({
    ...p,
    outstanding_invoice_count: countMap[p.id] || 0,
  }));

  res.json({ data: result });
});

// GET /api/properties/:id
router.get("/properties/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const propertyId = req.params.id;

  const { data: link } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single();

  if (!link) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (error || !property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.json({ data: property });
});

// GET /api/properties/:id/invoices
router.get("/properties/:id/invoices", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const propertyId = req.params.id;

  const { data: link } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single();

  if (!link) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("property_id", propertyId)
    .order("issue_date", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
    return;
  }

  res.json({ data: data || [] });
});

// GET /api/properties/:id/balance
router.get("/properties/:id/balance", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const propertyId = req.params.id;

  const { data: link } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single();

  if (!link) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("amount, status")
    .eq("property_id", propertyId);

  if (error) {
    res.status(500).json({ error: "Failed to fetch balance" });
    return;
  }

  const totalOutstanding = (invoices || [])
    .filter((inv) => ["unpaid", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalPaid = (invoices || [])
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  res.json({
    data: {
      totalOutstanding,
      totalPaid,
      currency: "GBP",
    },
  });
});

// GET /api/properties/:id/statements
router.get(
  "/properties/:id/statements",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const propertyId = req.params.id;

    const { data: link } = await supabase
      .from("user_properties")
      .select("property_id")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .single();

    if (!link) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const { data, error } = await supabase
      .from("statements")
      .select("*")
      .eq("property_id", propertyId)
      .order("period_from", { ascending: false });

    if (error) {
      res.status(500).json({ error: "Failed to fetch statements" });
      return;
    }

    res.json({ data: data || [] });
  },
);

// GET /api/invoices/:id
router.get("/invoices/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, properties(*)")
    .eq("id", req.params.id)
    .single();

  if (error || !invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const { data: link } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId)
    .eq("property_id", invoice.property_id)
    .single();

  if (!link) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json({ data: invoice });
});

// GET /api/statements/:id
router.get("/statements/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: statement, error } = await supabase
    .from("statements")
    .select("*, properties(*)")
    .eq("id", req.params.id)
    .single();

  if (error || !statement) {
    res.status(404).json({ error: "Statement not found" });
    return;
  }

  const { data: link } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId)
    .eq("property_id", statement.property_id)
    .single();

  if (!link) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  res.json({ data: statement });
});

// GET /api/service-requests
router.get("/service-requests", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data, error } = await supabase
    .from("service_requests")
    .select("*, properties(address_line1, city, postcode)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to fetch service requests" });
    return;
  }

  res.json({ data: data || [] });
});

// POST /api/service-requests
router.post("/service-requests", async (req: Request, res: Response) => {
  const { propertyId, requestType, notes } = req.body as {
    propertyId: string;
    requestType: string;
    notes: string;
  };

  if (!propertyId || !requestType || !notes) {
    res
      .status(422)
      .json({ error: "propertyId, requestType and notes are required" });
    return;
  }

  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;

  const { data: link } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single();

  if (!link) {
    res.status(403).json({ error: "You do not have access to this property" });
    return;
  }

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      property_id: propertyId,
      request_type: requestType,
      status: "submitted",
      notes,
    })
    .select("*, properties(address_line1, city, postcode)")
    .single();

  if (error) {
    res.status(500).json({ error: "Failed to create service request" });
    return;
  }

  res.status(201).json({ data });
});

// GET /api/documents/invoices
router.get("/documents/invoices", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: links } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId);

  const propertyIds = (links || []).map((l: any) => l.property_id);
  if (propertyIds.length === 0) {
    res.json({ data: [] });
    return;
  }

  const { data, error } = await supabase
    .from("invoices")
    .select("*, properties(address_line1, city, postcode)")
    .in("property_id", propertyIds)
    .order("issue_date", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to fetch invoices" });
    return;
  }

  res.json({ data: data || [] });
});

// GET /api/documents/statements
router.get("/documents/statements", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const { data: links } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId);

  const propertyIds = (links || []).map((l: any) => l.property_id);
  if (propertyIds.length === 0) {
    res.json({ data: [] });
    return;
  }

  const { data, error } = await supabase
    .from("statements")
    .select("*, properties(address_line1, city, postcode)")
    .in("property_id", propertyIds)
    .order("period_from", { ascending: false });

  if (error) {
    res.status(500).json({ error: "Failed to fetch statements" });
    return;
  }

  res.json({ data: data || [] });
});

// GET /api/account-balance
router.get("/account-balance", async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // Step 1: Get property IDs linked to this user
  const { data: links } = await supabase
    .from("user_properties")
    .select("property_id")
    .eq("user_id", userId);

  const propertyIds = (links || []).map((l: any) => l.property_id);
  if (propertyIds.length === 0) {
    res.json({ data: { totalOutstanding: 0, totalPaid: 0 } });
    return;
  }

  // Step 2: Sum invoices for all these properties
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("amount, status")
    .in("property_id", propertyIds);

  if (error) {
    res.status(500).json({ error: "Failed to fetch account balance" });
    return;
  }

  const totalOutstanding = (invoices || [])
    .filter((inv) => ["unpaid", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  const totalPaid = (invoices || [])
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.amount), 0);

  res.json({
    data: {
      totalOutstanding,
      totalPaid,
      currency: "GBP",
    },
  });
});

// GET /api/payments/instructions/:invoiceId
router.get(
  "/payments/instructions/:invoiceId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const tenantId = req.user!.tenantId;
    const invoiceId = req.params.invoiceId;

    // Check access to invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, property_id, invoice_number, amount")
      .eq("id", invoiceId)
      .single();

    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    const { data: link } = await supabase
      .from("user_properties")
      .select("property_id")
      .eq("user_id", userId)
      .eq("property_id", invoice.property_id)
      .single();

    if (!link) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Get tenant bank details
    const { data: tenant } = await supabase
      .from("tenants")
      .select(
        "bank_account_name, bank_sort_code, bank_account_number, min_payment_amount",
      )
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      res.status(404).json({ error: "Tenant bank details not found" });
      return;
    }

    res.json({
      data: {
        amount: invoice.amount,
        reference: invoice.invoice_number,
        bankDetails: {
          accountName: tenant.bank_account_name,
          sortCode: tenant.bank_sort_code,
          accountNumber: tenant.bank_account_number,
        },
        thresholds: {
          minAmount: tenant.min_payment_amount,
        },
      },
    });
  },
);

// GET /api/documents/:type/:id/view — dynamic PDF generation
router.get("/documents/:type/:id/view", async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const userId = req.user!.userId;

  if (type !== 'invoice' && type !== 'statement') {
    res.status(400).json({ error: "Invalid document type" });
    return;
  }

  try {
    // 1. Verify access (copying logic from detail routes for simplicity)
    const table = type === 'invoice' ? 'invoices' : 'statements';
    const { data: resource } = await supabase
      .from(table)
      .select("property_id")
      .eq("id", id)
      .single();

    if (!resource) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const { data: link } = await supabase
      .from("user_properties")
      .select("property_id")
      .eq("user_id", userId)
      .eq("property_id", resource.property_id)
      .single();

    if (!link) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // 2. Generate PDF
    const { DocumentService } = await import("../services/document.service");
    const pdfBuffer = await DocumentService.generate(type as 'invoice' | 'statement', id);

    // 3. Stream to response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${type}-${id.slice(0, 8)}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    res.status(500).json({ error: "Failed to generate document" });
  }
});

export default router;
