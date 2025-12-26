import { NextRequest, NextResponse } from 'next/server';
import { sendOTP } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await sendOTP(email.toLowerCase().trim());

    return NextResponse.json(result);
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
