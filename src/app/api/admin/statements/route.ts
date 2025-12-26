import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const propertyId = searchParams.get('property_id');

    let whereClause = 'WHERE os.year = $1';
    const params: any[] = [year];
    let paramIndex = 2;

    if (user.role === 'owner') {
      whereClause += ` AND p.owner_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (propertyId) {
      whereClause += ` AND os.property_id = $${paramIndex++}`;
      params.push(propertyId);
    }

    const statements = await query(
      `SELECT os.*, p.name as property_name, u.name as owner_name
       FROM owner_statements os
       JOIN properties p ON os.property_id = p.id
       LEFT JOIN users u ON p.owner_id = u.id
       ${whereClause}
       ORDER BY os.year DESC, os.month DESC`,
      params
    );

    return NextResponse.json({ success: true, data: statements });
  } catch (error) {
    console.error('Statements GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statements' },
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
    const { property_id, month, year } = body;

    if (!property_id || !month || !year) {
      return NextResponse.json(
        { success: false, error: 'Property, month, and year are required' },
        { status: 400 }
      );
    }

    // Check if statement already exists
    const existing = await queryOne(
      `SELECT id FROM owner_statements WHERE property_id = $1 AND month = $2 AND year = $3`,
      [property_id, month, year]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Statement already exists for this period' },
        { status: 400 }
      );
    }

    // Calculate revenue from reservations
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const revenueResult = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(total_payout), 0) as total
       FROM reservations r
       JOIN property_units pu ON r.unit_id = pu.id
       WHERE pu.property_id = $1
       AND r.check_out >= $2 AND r.check_out <= $3
       AND r.status = 'confirmed'`,
      [property_id, startDate.toISOString(), endDate.toISOString()]
    );

    // Calculate expenses
    const expensesResult = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE property_id = $1
       AND expense_date >= $2 AND expense_date <= $3`,
      [property_id, startDate.toISOString(), endDate.toISOString()]
    );

    const totalRevenue = parseFloat(revenueResult?.total || '0');
    const totalExpenses = parseFloat(expensesResult?.total || '0');
    const netIncome = totalRevenue - totalExpenses;

    // Create statement
    const result = await query(
      `INSERT INTO owner_statements (property_id, month, year, total_revenue, total_expenses, net_income, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, false)
       RETURNING *`,
      [property_id, month, year, totalRevenue, totalExpenses, netIncome]
    );

    const statement = result[0];

    await createAuditLog({
      user_id: user.id,
      action: 'create',
      entity_type: 'owner_statement',
      entity_id: statement.id,
      new_values: { property_id, month, year, totalRevenue, totalExpenses, netIncome },
    });

    return NextResponse.json({ success: true, data: statement }, { status: 201 });
  } catch (error) {
    console.error('Statements POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create statement' },
      { status: 500 }
    );
  }
}
