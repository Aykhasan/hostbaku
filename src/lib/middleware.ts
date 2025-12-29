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

// Development mode: Create mock users for testing
function getDevMockUser(role: 'admin' | 'cleaner' | 'owner'): User {
  const mockUsers: Record<string, User> = {
    admin: {
      id: 'dev-admin-1',
      email: 'admin@test.com',
      name: 'Dev Admin',
      role: 'admin',
      phone: '+1234567890',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    cleaner: {
      id: 'dev-cleaner-1',
      email: 'cleaner@test.com',
      name: 'Dev Cleaner',
      role: 'cleaner',
      phone: '+1234567891',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    owner: {
      id: 'dev-owner-1',
      email: 'owner@test.com',
      name: 'Dev Owner',
      role: 'owner',
      phone: '+1234567892',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  };
  return mockUsers[role] || mockUsers.admin;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: User | null; error: string | null }> {
  // Development mode: Check for dev query parameter or cookie
  if (process.env.NODE_ENV === 'development') {
    const url = new URL(request.url);
    const devRole = url.searchParams.get('dev') || request.cookies.get('dev-role')?.value;
    
    if (devRole && ['admin', 'cleaner', 'owner'].includes(devRole)) {
      const mockUser = getDevMockUser(devRole as 'admin' | 'cleaner' | 'owner');
      return { user: mockUser, error: null };
    }
  }
  
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

// Verify authentication and return user or error
export async function verifyAuth(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: User } | { error: string; status: number }> {
  const { user, error } = await authenticateRequest(request);
  
  if (error || !user) {
    return { error: error || 'Unauthorized', status: 401 };
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: 'Forbidden: Insufficient permissions', status: 403 };
  }
  
  return { user };
}
