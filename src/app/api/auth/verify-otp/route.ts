import { NextRequest, NextResponse } from 'next/server';
import { loginWithOTP } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and code are required' },
        { status: 400 }
      );
    }

    const result = await loginWithOTP(email.toLowerCase().trim(), code);

    if (result.success) {
      const response = NextResponse.json(result);
      
      // Set HTTP-only cookie for the token
      response.cookies.set('token', result.token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json(result, { status: 401 });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
