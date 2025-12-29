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
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;

    // Get properties owned by this user
    const propertiesResult = await query(
      'SELECT id FROM properties WHERE owner_id = $1',
      [userId]
    );
    const propertyIds = propertiesResult.map(p => p.id);

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalRevenue: 0,
          totalExpenses: 0,
          netIncome: 0,
          occupancyRate: 0,
          propertyCount: 0,
          upcomingReservations: 0,
          openTickets: 0,
        }
      });
    }

    // Total revenue (YTD) from published statements
    const revenueResult = await query(
      `SELECT COALESCE(SUM(total_revenue), 0) as total
       FROM owner_statements 
       WHERE property_id = ANY($1) 
       AND statement_date >= $2 
       AND statement_date <= $3
       AND published = true`,
      [propertyIds, startOfYear, endOfYear]
    );

    // Total expenses (YTD) from published statements
    const expensesResult = await query(
      `SELECT COALESCE(SUM(total_expenses), 0) as total
       FROM owner_statements 
       WHERE property_id = ANY($1) 
       AND statement_date >= $2 
       AND statement_date <= $3
       AND published = true`,
      [propertyIds, startOfYear, endOfYear]
    );

    // Calculate occupancy rate
    const today = new Date().toISOString().split('T')[0];
    const daysInYear = Math.floor((new Date(today).getTime() - new Date(startOfYear).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const occupiedDaysResult = await query(
      `SELECT COUNT(DISTINCT check_in + generate_series(0, check_out::date - check_in::date - 1)) as days
       FROM reservations r
       JOIN property_units pu ON r.unit_id = pu.id
       WHERE pu.property_id = ANY($1)
       AND check_in >= $2
       AND check_in <= $3`,
      [propertyIds, startOfYear, today]
    );

    // Count total unit-days available
    const unitsResult = await query(
      `SELECT COUNT(*) as count FROM property_units WHERE property_id = ANY($1)`,
      [propertyIds]
    );
    const totalUnits = parseInt(unitsResult[0]?.count || '1');
    const totalAvailableDays = totalUnits * daysInYear;
    const occupiedDays = parseInt(occupiedDaysResult[0]?.days || '0');
    const occupancyRate = totalAvailableDays > 0 ? Math.round((occupiedDays / totalAvailableDays) * 100) : 0;

    // Upcoming reservations count
    const upcomingResult = await query(
      `SELECT COUNT(*) as count
       FROM reservations r
       JOIN property_units pu ON r.unit_id = pu.id
       WHERE pu.property_id = ANY($1)
       AND r.check_in >= $2`,
      [propertyIds, today]
    );

    // Open maintenance tickets
    const ticketsResult = await query(
      `SELECT COUNT(*) as count
       FROM maintenance_tickets
       WHERE property_id = ANY($1)
       AND status IN ('open', 'in_progress')`,
      [propertyIds]
    );

    const totalRevenue = parseFloat(revenueResult[0]?.total || '0');
    const totalExpenses = parseFloat(expensesResult[0]?.total || '0');

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        occupancyRate,
        propertyCount: propertyIds.length,
        upcomingReservations: parseInt(upcomingResult[0]?.count || '0'),
        openTickets: parseInt(ticketsResult[0]?.count || '0'),
      }
    });
  } catch (error) {
    console.error('Error fetching owner stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
