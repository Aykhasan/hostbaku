import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { v4 as uuidv4 } from 'uuid';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['owner']);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const propertyId = searchParams.get('property_id');

    let sql = `
      SELECT 
        mt.id,
        mt.property_id,
        mt.unit_id,
        mt.title,
        mt.description,
        mt.priority,
        mt.status,
        mt.resolution_notes,
        mt.created_at,
        mt.resolved_at,
        p.name as property_name,
        pu.name as unit_name
      FROM maintenance_tickets mt
      JOIN properties p ON mt.property_id = p.id
      LEFT JOIN property_units pu ON mt.unit_id = pu.id
      WHERE p.owner_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      sql += ` AND mt.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (propertyId) {
      sql += ` AND mt.property_id = $${paramIndex}`;
      params.push(propertyId);
      paramIndex++;
    }

    sql += ` ORDER BY 
      CASE mt.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      mt.created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching maintenance tickets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['owner']);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { property_id, unit_id, title, description, priority = 'medium' } = body;

    if (!property_id || !title) {
      return NextResponse.json(
        { success: false, error: 'Property and title are required' },
        { status: 400 }
      );
    }

    // Verify owner owns this property
    const propertyCheck = await query(
      'SELECT id FROM properties WHERE id = $1 AND owner_id = $2',
      [property_id, userId]
    );

    if (propertyCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Property not found or access denied' },
        { status: 403 }
      );
    }

    const ticketId = uuidv4();

    await query(
      `INSERT INTO maintenance_tickets (id, property_id, unit_id, reported_by, title, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')`,
      [ticketId, property_id, unit_id || null, userId, title, description || '', priority]
    );

    await createAuditLog({
      userId,
      action: 'create',
      entityType: 'maintenance_ticket',
      entityId: ticketId,
      newValues: { property_id, title, description, priority },
    });

    // Fetch the created ticket
    const result = await query(
      `SELECT 
        mt.*,
        p.name as property_name,
        pu.name as unit_name
       FROM maintenance_tickets mt
       JOIN properties p ON mt.property_id = p.id
       LEFT JOIN property_units pu ON mt.unit_id = pu.id
       WHERE mt.id = $1`,
      [ticketId]
    );

    return NextResponse.json({
      success: true,
      data: result[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance ticket' },
      { status: 500 }
    );
  }
}
