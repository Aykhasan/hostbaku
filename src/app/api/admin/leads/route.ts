import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authenticateRequest } from '@/lib/middleware';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let whereClause = '';
    const params: any[] = [];

    if (status) {
      whereClause = 'WHERE status = $1';
      params.push(status);
    }

    const leads = await query(
      `SELECT * FROM leads ${whereClause} ORDER BY created_at DESC`,
      params
    );

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// Public endpoint for submitting apartments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contact_name,
      contact_email,
      contact_phone,
      location,
      layout,
      listing_link,
      notes,
    } = body;

    if (!contact_name || !contact_email || !location || !layout) {
      return NextResponse.json(
        { success: false, error: 'Name, email, location, and layout are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO leads (contact_name, contact_email, contact_phone, location, layout, listing_link, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new')
       RETURNING *`,
      [contact_name, contact_email, contact_phone || null, location, layout, listing_link || null, notes || null]
    );

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit lead' },
      { status: 500 }
    );
  }
}
