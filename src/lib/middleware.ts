import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromToken, JWTPayload } from './auth';
import { User, UserRole } from './types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  payload?: JWTPayload;
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  const tokenCookie = request.cookies.get('token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: User | null; error: string | null }> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { user: null, error: 'No authentication token provided' };
  }
  
  const user = await getUserFromToken(token);
  
  if (!user) {
    return { user: null, error: 'Invalid or expired token' };
  }
  
  return { user, error: null };
}

export function requireAuth(allowedRoles?: UserRole[]) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request);
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return null; // Continue to handler
  };
}

export function withAuth<T>(
  handler: (request: NextRequest, user: User) => Promise<NextResponse<T>>,
  allowedRoles?: UserRole[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authError = await requireAuth(allowedRoles)(request);
    if (authError) return authError;
    
    const { user } = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return handler(request, user);
  };
}

// Helper to check if user can access a property
export async function canAccessProperty(
  user: User,
  propertyId: string
): Promise<boolean> {
  if (user.role === 'admin') return true;
  
  const { query } = await import('./db');
  
  if (user.role === 'owner') {
    const property = await query(
      `SELECT id FROM properties WHERE id = $1 AND owner_id = $2`,
      [propertyId, user.id]
    );
    return property.length > 0;
  }
  
  if (user.role === 'cleaner') {
    const assignment = await query(
      `SELECT id FROM cleaner_assignments WHERE cleaner_id = $1 AND property_id = $2`,
      [user.id, propertyId]
    );
    return assignment.length > 0;
  }
  
  return false;
}

// Helper to check if user can access a task
export async function canAccessTask(
  user: User,
  taskId: string
): Promise<boolean> {
  if (user.role === 'admin') return true;
  
  const { queryOne } = await import('./db');
  
  const task = await queryOne<{ property_id: string; assigned_to: string | null }>(
    `SELECT property_id, assigned_to FROM tasks WHERE id = $1`,
    [taskId]
  );
  
  if (!task) return false;
  
  if (user.role === 'cleaner') {
    return task.assigned_to === user.id;
  }
  
  if (user.role === 'owner') {
    return canAccessProperty(user, task.property_id);
  }
  
  return false;
}
