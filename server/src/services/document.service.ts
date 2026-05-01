import { supabase } from "../config/supabase";
import { TemplateService } from "./template.service";

export interface DocumentMetadata {
  title: string;
  propertyId: string;
  tenantId: string;
  resourceType: 'invoice' | 'statement';
  resourceId: string;
}

export class DocumentService {
  /**
   * Generates a PDF document for a given resource on the fly.
   */
  static async generate(resourceType: 'invoice' | 'statement', resourceId: string): Promise<Buffer> {
    const table = resourceType === 'invoice' ? 'invoices' : 'statements';

    // 1. Fetch resource data
    const { data: resource, error: resError } = await supabase
      .from(table)
      .select("*, properties(*)")
      .eq("id", resourceId)
      .single();

    if (resError || !resource) throw new Error(`${resourceType} not found`);

    // 2. Fetch tenant branding
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("name, logo_url, primary_color")
      .eq("id", resource.tenant_id)
      .single();

    const branding = tenant || { name: 'Property Management Portal' };

    // 3. Prepare data for template
    const property = resource.properties;
    const address = `${property.address_line1}${property.address_line2 ? ', ' + property.address_line2 : ''}, ${property.city}, ${property.postcode}`;

    const pdfData = {
      title: resourceType.toUpperCase(),
      subtitle: resourceType === 'invoice' ? 'Invoice' : 'Statement',
      date: new Date(resource.created_at).toLocaleDateString(),
      number: resource.invoice_number || resource.statement_number || resourceId.slice(0, 8),
      amount: resource.amount,
      currency: 'GBP',
      propertyAddress: address,
      tenantBranding: {
        name: branding.name,
        logo_url: (branding as { logo_url: string }).logo_url,
        primary_color: (branding as { primary_color: string }).primary_color
      }
    };

    // 4. Generate PDF
    return await TemplateService.generatePDF(pdfData);
  }

  /**
   * Stub for Phase 1 compatibility - not strictly needed for on-the-fly but kept to avoid breaking changes
   */
  static async ensureDocument(resourceType: 'invoice' | 'statement', resourceId: string): Promise<void> {
    // For on-the-fly generation, we don't need to "ensure" a stored document
    return;
  }
}
