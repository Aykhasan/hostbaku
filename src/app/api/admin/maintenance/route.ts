import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const propertyId = searchParams.get('property_id');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'owner') {
      whereClause += ` AND p.owner_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (status) {
      whereClause += ` AND mt.status = $${paramIndex++}`;
      params.push(status);
    }

    if (priority) {
      whereClause += ` AND mt.priority = $${paramIndex++}`;
      params.push(priority);
    }

    if (propertyId) {
      whereClause += ` AND mt.property_id = $${paramIndex++}`;
      params.push(propertyId);
    }

    const tickets = await query(
      `SELECT mt.*, p.name as property_name, pu.name as unit_name, u.name as reporter_name
       FROM maintenance_tickets mt
       JOIN properties p ON mt.property_id = p.id
       LEFT JOIN property_units pu ON mt.unit_id = pu.id
       LEFT JOIN users u ON mt.reported_by = u.id
       ${whereClause}
       ORDER BY 
         CASE mt.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           ELSE 4 
         END,
         mt.created_at DESC`,
      params
    );

    return NextResponse.json({ success: true, data: tickets });
  } catch (error) {
    console.error('Maintenance GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      property_id,
      unit_id,
      title,
      description,
      priority = 'medium',
    } = body;

    if (!property_id || !title) {
      return NextResponse.json(
        { success: false, error: 'Property and title are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO maintenance_tickets (property_id, unit_id, reported_by, title, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open')
       RETURNING *`,
      [property_id, unit_id || null, user.id, title, description || null, priority]
    );

    const ticket = result[0];

    await createAuditLog({
      user_id: user.id,
      action: 'create',
      entity_type: 'maintenance_ticket',
      entity_id: ticket.id,
      new_values: body,
    });

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch (error) {
    console.error('Maintenance POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance ticket' },
      { status: 500 }
    );
  }
}
