import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { saveBase64Image } from '@/lib/uploads';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const body = await request.json();
    const { photos } = body; // Array of base64 images

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { success: false, error: 'Photos array is required' },
        { status: 400 }
      );
    }

    const savedPhotos = [];

    for (const base64Image of photos) {
      try {
        const photoUrl = await saveBase64Image(base64Image, 'tasks');
        
        const result = await query(
          `INSERT INTO task_photos (task_id, photo_url, uploaded_by)
           VALUES ($1, $2, $3)
           RETURNING id, photo_url as url`,
          [params.id, photoUrl, user.id]
        );
        
        savedPhotos.push(result[0]);
      } catch (err) {
        console.error('Error saving photo:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: savedPhotos,
    });
  } catch (error) {
    console.error('Photos POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload photos' },
      { status: 500 }
    );
  }
}
