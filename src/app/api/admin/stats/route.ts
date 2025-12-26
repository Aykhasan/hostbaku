import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Get total properties
    const propertiesResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM properties WHERE is_active = true`
    );
    const totalProperties = parseInt(propertiesResult?.count || '0');

    // Get active reservations (currently checked in or upcoming this week)
    const activeReservationsResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE check_in <= CURRENT_DATE + INTERVAL '7 days' AND check_out >= CURRENT_DATE`
    );
    const activeReservations = parseInt(activeReservationsResult?.count || '0');

    // Get pending tasks
    const pendingTasksResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM tasks WHERE status IN ('todo', 'in_progress')`
    );
    const pendingTasks = parseInt(pendingTasksResult?.count || '0');

    // Get monthly revenue
    const revenueResult = await queryOne<{ total: string }>(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM reservations 
       WHERE check_in >= $1 AND check_in <= $2`,
      [monthStart, monthEnd]
    );
    const monthlyRevenue = parseFloat(revenueResult?.total || '0');

    // Calculate occupancy rate (for current month)
    const daysInMonth = monthEnd.getDate();
    const occupiedDaysResult = await queryOne<{ days: string }>(
      `SELECT COALESCE(SUM(
        LEAST(check_out, $2::date) - GREATEST(check_in, $1::date)
      ), 0) as days
      FROM reservations 
      WHERE check_in <= $2 AND check_out >= $1`,
      [monthStart, monthEnd]
    );
    const occupiedDays = parseInt(occupiedDaysResult?.days || '0');
    const occupancyRate = totalProperties > 0 
      ? Math.round((occupiedDays / (daysInMonth * totalProperties)) * 100)
      : 0;

    // Get new leads this month
    const leadsResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM leads WHERE created_at >= $1`,
      [monthStart]
    );
    const newLeads = parseInt(leadsResult?.count || '0');

    return NextResponse.json({
      success: true,
      data: {
        totalProperties,
        activeReservations,
        pendingTasks,
        monthlyRevenue,
        occupancyRate,
        newLeads,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
