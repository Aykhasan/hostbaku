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

    // Get all properties owned by this user with unit counts
    const result = await query(
      `SELECT 
        p.id,
        p.name,
        p.address,
        p.city,
        p.created_at,
        COUNT(DISTINCT pu.id) as unit_count,
        COUNT(DISTINCT CASE WHEN r.check_out > NOW() AND r.check_in <= NOW() THEN r.id END) as active_reservations
       FROM properties p
       LEFT JOIN property_units pu ON p.id = pu.property_id
       LEFT JOIN reservations r ON pu.id = r.unit_id
       WHERE p.owner_id = $1
       GROUP BY p.id, p.name, p.address, p.city, p.created_at
       ORDER BY p.name ASC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        unit_count: parseInt(row.unit_count),
        active_reservations: parseInt(row.active_reservations),
      }))
    });
  } catch (error) {
    console.error('Error fetching owner properties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
