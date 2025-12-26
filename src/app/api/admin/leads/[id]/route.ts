import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const lead = await queryOne(
      'SELECT * FROM leads WHERE id = $1',
      [params.id]
    );

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lead });
  } catch (error) {
    console.error('Lead GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, notes } = body;

    const oldLead = await queryOne('SELECT * FROM leads WHERE id = $1', [params.id]);
    if (!oldLead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    updates.push(`updated_at = NOW()`);

    values.push(params.id);

    const result = await query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    await createAuditLog({
      user_id: user.id,
      action: 'update',
      entity_type: 'lead',
      entity_id: params.id,
      old_values: oldLead,
      new_values: body,
    });

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Lead PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await query('DELETE FROM leads WHERE id = $1', [params.id]);

    await createAuditLog({
      user_id: user.id,
      action: 'delete',
      entity_type: 'lead',
      entity_id: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
