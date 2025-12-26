import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { Task } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const taskType = searchParams.get('task_type');
    const propertyId = searchParams.get('property_id');
    const assignedTo = searchParams.get('assigned_to');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'cleaner') {
      whereClause += ` AND t.assigned_to = $${paramIndex++}`;
      params.push(user.id);
    } else if (user.role === 'owner') {
      whereClause += ` AND p.owner_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (status) {
      const statuses = status.split(',');
      whereClause += ` AND t.status = ANY($${paramIndex++}::task_status[])`;
      params.push(statuses);
    }

    if (taskType) {
      whereClause += ` AND t.task_type = $${paramIndex++}`;
      params.push(taskType);
    }

    if (propertyId) {
      whereClause += ` AND t.property_id = $${paramIndex++}`;
      params.push(propertyId);
    }

    if (assignedTo) {
      whereClause += ` AND t.assigned_to = $${paramIndex++}`;
      params.push(assignedTo);
    }

    params.push(limit, offset);

    const tasks = await query<Task>(
      `SELECT t.*, 
              p.name as property_name, 
              p.address as property_address,
              u.name as assigned_name
       FROM tasks t
       LEFT JOIN properties p ON t.property_id = p.id
       LEFT JOIN users u ON t.assigned_to = u.id
       ${whereClause}
       ORDER BY 
         CASE WHEN t.status = 'todo' THEN 0 
              WHEN t.status = 'in_progress' THEN 1 
              ELSE 2 END,
         t.due_date ASC NULLS LAST,
         t.priority ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM tasks t
       LEFT JOIN properties p ON t.property_id = p.id
       ${whereClause}`,
      params.slice(0, -2)
    );
    const total = parseInt(countResult?.count || '0');

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      property_id,
      unit_id,
      reservation_id,
      assigned_to,
      task_type,
      title,
      description,
      due_date,
      due_time,
      priority,
      checklist,
    } = body;

    if (!property_id || !task_type || !title) {
      return NextResponse.json(
        { success: false, error: 'Property, task type, and title are required' },
        { status: 400 }
      );
    }

    const defaultChecklists: Record<string, { id: string; text: string; checked: boolean }[]> = {
      turnover_clean: [
        { id: '1', text: 'Strip beds and start laundry', checked: false },
        { id: '2', text: 'Clean bathroom thoroughly', checked: false },
        { id: '3', text: 'Vacuum and mop all floors', checked: false },
        { id: '4', text: 'Wipe down kitchen surfaces', checked: false },
        { id: '5', text: 'Clean appliances (microwave, fridge)', checked: false },
        { id: '6', text: 'Empty all trash bins', checked: false },
        { id: '7', text: 'Restock amenities', checked: false },
        { id: '8', text: 'Make beds with fresh linens', checked: false },
        { id: '9', text: 'Final walkthrough and photos', checked: false },
      ],
      deep_clean: [
        { id: '1', text: 'Move furniture and clean underneath', checked: false },
        { id: '2', text: 'Deep clean oven and stovetop', checked: false },
        { id: '3', text: 'Clean inside refrigerator', checked: false },
        { id: '4', text: 'Wash windows inside and out', checked: false },
        { id: '5', text: 'Clean air vents and filters', checked: false },
        { id: '6', text: 'Shampoo carpets/deep clean floors', checked: false },
        { id: '7', text: 'Descale bathroom fixtures', checked: false },
        { id: '8', text: 'Clean light fixtures and fans', checked: false },
        { id: '9', text: 'Wipe down walls and baseboards', checked: false },
        { id: '10', text: 'Clean behind appliances', checked: false },
      ],
      inspection: [
        { id: '1', text: 'Check all appliances working', checked: false },
        { id: '2', text: 'Test smoke and CO detectors', checked: false },
        { id: '3', text: 'Inspect for any damage', checked: false },
        { id: '4', text: 'Check water pressure and drainage', checked: false },
        { id: '5', text: 'Test all lights and outlets', checked: false },
        { id: '6', text: 'Check locks and security', checked: false },
        { id: '7', text: 'Inventory amenities and supplies', checked: false },
        { id: '8', text: 'Document any issues with photos', checked: false },
      ],
      maintenance: [
        { id: '1', text: 'Assess the issue', checked: false },
        { id: '2', text: 'Document before photos', checked: false },
        { id: '3', text: 'Complete repair/maintenance', checked: false },
        { id: '4', text: 'Test that issue is resolved', checked: false },
        { id: '5', text: 'Document after photos', checked: false },
        { id: '6', text: 'Clean up work area', checked: false },
      ],
    };

    const taskChecklist = checklist || defaultChecklists[task_type] || [];

    const result = await query<Task>(
      `INSERT INTO tasks (property_id, unit_id, reservation_id, assigned_to, created_by, task_type, title, description, due_date, due_time, priority, checklist)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        property_id,
        unit_id || null,
        reservation_id || null,
        assigned_to || null,
        user.id,
        task_type,
        title,
        description || null,
        due_date || null,
        due_time || null,
        priority || 2,
        JSON.stringify(taskChecklist),
      ]
    );

    const task = result[0];

    await createAuditLog({
      user_id: user.id,
      action: 'create',
      entity_type: 'task',
      entity_id: task.id,
      new_values: body,
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
