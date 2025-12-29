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
    const year = searchParams.get('year');

    let sql = `
      SELECT 
        os.id,
        os.property_id,
        os.statement_date,
        os.total_revenue,
        os.total_expenses,
        os.net_income,
        os.management_fee,
        os.notes,
        os.published,
        os.created_at,
        p.name as property_name
      FROM owner_statements os
      JOIN properties p ON os.property_id = p.id
      WHERE p.owner_id = $1 AND os.published = true
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (propertyId) {
      sql += ` AND os.property_id = $${paramIndex}`;
      params.push(propertyId);
      paramIndex++;
    }

    if (year) {
      sql += ` AND EXTRACT(YEAR FROM os.statement_date) = $${paramIndex}`;
      params.push(parseInt(year));
      paramIndex++;
    }

    sql += ` ORDER BY os.statement_date DESC`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.map(row => ({
        ...row,
        total_revenue: parseFloat(row.total_revenue),
        total_expenses: parseFloat(row.total_expenses),
        net_income: parseFloat(row.net_income),
        management_fee: parseFloat(row.management_fee),
      }))
    });
  } catch (error) {
    console.error('Error fetching owner statements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statements' },
      { status: 500 }
    );
  }
}
