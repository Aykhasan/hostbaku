import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/middleware';
import { generateOwnerStatementPDF } from '@/lib/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request, ['owner', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const statementId = params.id;
    const userId = authResult.user.id;
    const isAdmin = authResult.user.role === 'admin';

    // Fetch statement with property info
    let sql = `
      SELECT 
        os.*,
        p.name as property_name,
        p.address as property_address,
        p.city as property_city,
        u.name as owner_name,
        u.email as owner_email
      FROM owner_statements os
      JOIN properties p ON os.property_id = p.id
      JOIN users u ON p.owner_id = u.id
      WHERE os.id = $1
    `;
    const params_arr: any[] = [statementId];

    // If not admin, ensure owner can only access their own statements
    if (!isAdmin) {
      sql += ` AND p.owner_id = $2 AND os.published = true`;
      params_arr.push(userId);
    }

    const statementResult = await query(sql, params_arr);

    if (statementResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Statement not found' },
        { status: 404 }
      );
    }

    const statement = statementResult[0];
    const statementDate = new Date(statement.statement_date);
    const year = statementDate.getFullYear();
    const month = statementDate.getMonth();

    // Get the first and last day of the statement month
    const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Fetch reservations for this property during this month
    const reservationsResult = await query(
      `SELECT 
        r.guest_name,
        r.check_in,
        r.check_out,
        r.total_price,
        r.source,
        pu.name as unit_name
       FROM reservations r
       JOIN property_units pu ON r.unit_id = pu.id
       WHERE pu.property_id = $1
       AND (
         (r.check_in >= $2 AND r.check_in <= $3)
         OR (r.check_out >= $2 AND r.check_out <= $3)
         OR (r.check_in <= $2 AND r.check_out >= $3)
       )
       ORDER BY r.check_in ASC`,
      [statement.property_id, startOfMonth, endOfMonth]
    );

    // Fetch expenses for this property during this month
    const expensesResult = await query(
      `SELECT 
        e.description,
        e.amount,
        e.expense_date,
        e.category
       FROM expenses e
       WHERE e.property_id = $1
       AND e.expense_date >= $2
       AND e.expense_date <= $3
       ORDER BY e.expense_date ASC`,
      [statement.property_id, startOfMonth, endOfMonth]
    );

    // Generate PDF
    const pdfBuffer = await generateOwnerStatementPDF({
      statement: {
        ...statement,
        total_revenue: parseFloat(statement.total_revenue),
        total_expenses: parseFloat(statement.total_expenses),
        net_income: parseFloat(statement.net_income),
        management_fee: parseFloat(statement.management_fee),
      },
      reservations: reservationsResult.map(r => ({
        ...r,
        total_price: parseFloat(r.total_price),
      })),
      expenses: expensesResult.map(e => ({
        ...e,
        amount: parseFloat(e.amount),
      })),
    });

    // Format filename
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const filename = `Statement_${statement.property_name.replace(/\s+/g, '_')}_${monthNames[month]}_${year}.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating statement PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
