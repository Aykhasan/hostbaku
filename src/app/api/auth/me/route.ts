import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    // Development mode: Check for dev query parameter
    if (process.env.NODE_ENV === 'development') {
      const url = new URL(request.url);
      const devRole = url.searchParams.get('dev') || request.cookies.get('dev-role')?.value;
      
      if (devRole && ['admin', 'cleaner', 'owner'].includes(devRole)) {
        const mockUsers: Record<string, any> = {
          admin: { id: 'dev-admin-1', email: 'admin@test.com', name: 'Dev Admin', role: 'admin', phone: '+1234567890' },
          cleaner: { id: 'dev-cleaner-1', email: 'cleaner@test.com', name: 'Dev Cleaner', role: 'cleaner', phone: '+1234567891' },
          owner: { id: 'dev-owner-1', email: 'owner@test.com', name: 'Dev Owner', role: 'owner', phone: '+1234567892' },
        };
        
        const response = NextResponse.json({
          success: true,
          user: mockUsers[devRole],
        });
        
        // Set cookie for subsequent requests
        response.cookies.set('dev-role', devRole, { 
          httpOnly: false, 
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 // 24 hours
        });
        
        return response;
      }
    }
    
    const { user, error } = await authenticateRequest(request);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
