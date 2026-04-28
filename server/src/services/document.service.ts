import { supabase } from "../config/supabase";

export interface DocumentMetadata {
  title: string;
  propertyId: string;
  tenantId: string;
  resourceType: 'invoice' | 'statement';
  resourceId: string;
}

export class DocumentService {
  /**
   * Generates a PDF document for a given resource.
   * Currently a stub for Phase 1.
   */
  static async generate(metadata: DocumentMetadata): Promise<string> {
    console.log(`Generating ${metadata.resourceType} PDF for resource ${metadata.resourceId}...`);
    
    // In a real implementation:
    // 1. Fetch data for the resource
    // 2. Render HTML template
    // 3. Convert HTML to PDF (e.g. using puppeteer)
    // 4. Upload to Supabase Storage
    // 5. Update the record with the URL
    
    // MOCK: Return a placeholder URL if not already present
    return "https://example.com/mock-document.pdf";
  }

  /**
   * Sync existing documents or regenerate if missing.
   */
  static async ensureDocument(resourceType: 'invoice' | 'statement', resourceId: string): Promise<void> {
    const table = resourceType === 'invoice' ? 'invoices' : 'statements';
    
    const { data, error } = await supabase
      .from(table)
      .select("document_url, tenant_id, property_id")
      .eq("id", resourceId)
      .single();
      
    if (error || !data) return;
    
    if (!data.document_url) {
      const url = await this.generate({
        title: `${resourceType.toUpperCase()} #${resourceId.slice(0,8)}`,
        propertyId: data.property_id,
        tenantId: data.tenant_id,
        resourceType,
        resourceId
      });
      
      await supabase
        .from(table)
        .update({ document_url: url })
        .eq("id", resourceId);
    }
  }
}
