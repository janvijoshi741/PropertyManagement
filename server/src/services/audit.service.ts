import { supabase } from "../config/supabase";

export interface AuditLogParams {
  tenantId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  changes?: any;
}

export class AuditService {
  /**
   * Record an action in the audit logs
   */
  static async log({
    tenantId,
    userId,
    action,
    resourceType,
    resourceId,
    changes,
  }: AuditLogParams) {
    try {
      const { error } = await supabase.from("audit_logs").insert({
        tenant_id: tenantId,
        user_id: userId,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes,
      });

      if (error) {
        console.error("Failed to write audit log:", error.message);
      }
    } catch (e) {
      console.error("Audit logging error:", e);
    }
  }
}
