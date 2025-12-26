import { query } from './db';

export interface AuditLogEntry {
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      entry.user_id,
      entry.action,
      entry.entity_type,
      entry.entity_id,
      entry.old_values ? JSON.stringify(entry.old_values) : null,
      entry.new_values ? JSON.stringify(entry.new_values) : null,
      entry.ip_address || null,
      entry.user_agent || null,
    ]
  );
}

export async function getAuditLogs(
  filters: {
    user_id?: string;
    entity_type?: string;
    entity_id?: string;
    action?: string;
    from_date?: Date;
    to_date?: Date;
  },
  limit: number = 100,
  offset: number = 0
) {
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.user_id) {
    whereClause += ` AND user_id = $${paramIndex++}`;
    params.push(filters.user_id);
  }
  if (filters.entity_type) {
    whereClause += ` AND entity_type = $${paramIndex++}`;
    params.push(filters.entity_type);
  }
  if (filters.entity_id) {
    whereClause += ` AND entity_id = $${paramIndex++}`;
    params.push(filters.entity_id);
  }
  if (filters.action) {
    whereClause += ` AND action = $${paramIndex++}`;
    params.push(filters.action);
  }
  if (filters.from_date) {
    whereClause += ` AND created_at >= $${paramIndex++}`;
    params.push(filters.from_date);
  }
  if (filters.to_date) {
    whereClause += ` AND created_at <= $${paramIndex++}`;
    params.push(filters.to_date);
  }

  params.push(limit, offset);

  const logs = await query(
    `SELECT al.*, u.name as user_name, u.email as user_email
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    params
  );

  return logs;
}

// Helper to track changes for update operations
export function getChangedFields(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): { old: Record<string, any>; new: Record<string, any> } | null {
  const changedOld: Record<string, any> = {};
  const changedNew: Record<string, any> = {};

  for (const key of Object.keys(newValues)) {
    if (oldValues[key] !== newValues[key]) {
      changedOld[key] = oldValues[key];
      changedNew[key] = newValues[key];
    }
  }

  if (Object.keys(changedOld).length === 0) return null;

  return { old: changedOld, new: changedNew };
}
