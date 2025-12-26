import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'cleaner') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'today';

    let dateFilter = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const params: any[] = [user.id];

    if (filter === 'today') {
      dateFilter = `AND t.scheduled_date >= $2 AND t.scheduled_date < $3`;
      params.push(today.toISOString(), tomorrow.toISOString());
    } else if (filter === 'upcoming') {
      dateFilter = `AND t.scheduled_date >= $2 AND t.scheduled_date < $3`;
      params.push(today.toISOString(), nextWeek.toISOString());
    }
    // 'all' has no date filter

    const tasks = await query(
      `SELECT 
        t.id, t.property_id, t.unit_id, t.task_type, t.status, 
        t.scheduled_date, t.checklist, t.notes,
        p.name as property_name, p.address as property_address,
        pu.name as unit_name,
        (SELECT COUNT(*) FROM task_photos WHERE task_id = t.id) as photo_count
       FROM tasks t
       JOIN properties p ON t.property_id = p.id
       LEFT JOIN property_units pu ON t.unit_id = pu.id
       WHERE t.assigned_to = $1
       ${dateFilter}
       ORDER BY 
         CASE t.status 
           WHEN 'in_progress' THEN 1 
           WHEN 'todo' THEN 2 
           ELSE 3 
         END,
         t.scheduled_date ASC`,
      params
    );

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error('Cleaner tasks GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
