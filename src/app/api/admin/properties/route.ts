import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';
import { Property } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based filtering
    if (user.role === 'owner') {
      whereClause += ` AND p.owner_id = $${paramIndex++}`;
      params.push(user.id);
    } else if (user.role === 'cleaner') {
      whereClause += ` AND EXISTS (SELECT 1 FROM cleaner_assignments ca WHERE ca.property_id = p.id AND ca.cleaner_id = $${paramIndex++})`;
      params.push(user.id);
    }

    if (search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.address ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    params.push(limit, offset);

    const properties = await query<Property>(
      `SELECT p.*, u.name as owner_name
       FROM properties p
       LEFT JOIN users u ON p.owner_id = u.id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM properties p ${whereClause}`,
      params.slice(0, -2)
    );
    const total = parseInt(countResult?.count || '0');

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Properties GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties' },
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
      name,
      address,
      city,
      description,
      owner_id,
      bedrooms,
      bathrooms,
      max_guests,
      airbnb_link,
    } = body;

    if (!name || !address) {
      return NextResponse.json(
        { success: false, error: 'Name and address are required' },
        { status: 400 }
      );
    }

    const result = await query<Property>(
      `INSERT INTO properties (name, address, city, description, owner_id, bedrooms, bathrooms, max_guests, airbnb_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        address,
        city || null,
        description || null,
        owner_id || null,
        bedrooms || 1,
        bathrooms || 1,
        max_guests || 2,
        airbnb_link || null,
      ]
    );

    const property = result[0];

    await createAuditLog({
      user_id: user.id,
      action: 'create',
      entity_type: 'property',
      entity_id: property.id,
      new_values: body,
    });

    return NextResponse.json({ success: true, data: property }, { status: 201 });
  } catch (error) {
    console.error('Properties POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
