import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; photoId: string } }
) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'cleaner') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verify task belongs to this cleaner
    const task = await queryOne(
      'SELECT id FROM tasks WHERE id = $1 AND assigned_to = $2',
      [params.id, user.id]
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Delete the photo
    await query(
      'DELETE FROM task_photos WHERE id = $1 AND task_id = $2',
      [params.photoId, params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Photo DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
