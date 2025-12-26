import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'cleaner') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const task = await queryOne(
      `SELECT 
        t.id, t.property_id, t.unit_id, t.task_type, t.status, 
        t.scheduled_date, t.checklist, t.notes,
        p.name as property_name, p.address as property_address,
        pu.name as unit_name
       FROM tasks t
       JOIN properties p ON t.property_id = p.id
       LEFT JOIN property_units pu ON t.unit_id = pu.id
       WHERE t.id = $1 AND t.assigned_to = $2`,
      [params.id, user.id]
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get photos
    const photos = await query(
      `SELECT id, photo_url as url, caption FROM task_photos WHERE task_id = $1 ORDER BY created_at`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      data: { ...task, photos },
    });
  } catch (error) {
    console.error('Cleaner task GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'cleaner') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, checklist, notes } = body;

    // Verify task belongs to this cleaner
    const task = await queryOne(
      'SELECT * FROM tasks WHERE id = $1 AND assigned_to = $2',
      [params.id, user.id]
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
      
      if (status === 'done') {
        updates.push(`completed_at = NOW()`);
      }
    }

    if (checklist) {
      updates.push(`checklist = $${paramIndex++}`);
      values.push(JSON.stringify(checklist));
    }

    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    updates.push(`updated_at = NOW()`);
    values.push(params.id);

    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    await createAuditLog({
      user_id: user.id,
      action: 'update',
      entity_type: 'task',
      entity_id: params.id,
      old_values: task,
      new_values: body,
    });

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Cleaner task PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
