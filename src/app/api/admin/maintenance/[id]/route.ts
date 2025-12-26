import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ticket = await queryOne(
      `SELECT mt.*, p.name as property_name, pu.name as unit_name, u.name as reporter_name
       FROM maintenance_tickets mt
       JOIN properties p ON mt.property_id = p.id
       LEFT JOIN property_units pu ON mt.unit_id = pu.id
       LEFT JOIN users u ON mt.reported_by = u.id
       WHERE mt.id = $1`,
      [params.id]
    );

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error('Maintenance GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, priority, resolution_notes } = body;

    const oldTicket = await queryOne(
      'SELECT * FROM maintenance_tickets WHERE id = $1',
      [params.id]
    );

    if (!oldTicket) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
      
      if (status === 'resolved' || status === 'closed') {
        updates.push(`resolved_at = NOW()`);
      }
    }

    if (priority) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (resolution_notes !== undefined) {
      updates.push(`resolution_notes = $${paramIndex++}`);
      values.push(resolution_notes);
    }

    updates.push(`updated_at = NOW()`);
    values.push(params.id);

    const result = await query(
      `UPDATE maintenance_tickets SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    await createAuditLog({
      user_id: user.id,
      action: 'update',
      entity_type: 'maintenance_ticket',
      entity_id: params.id,
      old_values: oldTicket,
      new_values: body,
    });

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Maintenance PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
