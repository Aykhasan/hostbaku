import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request, ['owner']);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let sql = `
      SELECT 
        r.id,
        r.unit_id,
        r.guest_name,
        r.check_in,
        r.check_out,
        r.guests,
        r.source,
        r.total_price,
        r.notes,
        r.created_at,
        pu.name as unit_name,
        p.id as property_id,
        p.name as property_name
      FROM reservations r
      JOIN property_units pu ON r.unit_id = pu.id
      JOIN properties p ON pu.property_id = p.id
      WHERE p.owner_id = $1
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (propertyId) {
      sql += ` AND p.id = $${paramIndex}`;
      params.push(propertyId);
      paramIndex++;
    }

    if (upcoming) {
      sql += ` AND r.check_in >= CURRENT_DATE`;
    }

    sql += ` ORDER BY r.check_in ${upcoming ? 'ASC' : 'DESC'} LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching owner reservations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}
