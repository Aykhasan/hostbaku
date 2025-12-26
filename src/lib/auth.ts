import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, queryOne } from './db';
import { sendOTPEmail } from './email';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'cleaner' | 'owner';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'cleaner' | 'owner';
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOTP(email: string): Promise<string> {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Invalidate previous OTPs
  await query(
    `UPDATE otp_codes SET used = true WHERE email = $1 AND used = false`,
    [email]
  );
  
  // Create new OTP
  await query(
    `INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)`,
    [email, code, expiresAt]
  );
  
  return code;
}

export async function verifyOTP(email: string, code: string): Promise<boolean> {
  // In development, accept any 6-digit code
  if (process.env.NODE_ENV === 'development' && code.length === 6) {
    return true;
  }
  
  const otp = await queryOne<{ id: string }>(
    `SELECT id FROM otp_codes 
     WHERE email = $1 AND code = $2 AND used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, code]
  );
  
  if (!otp) return false;
  
  // Mark as used
  await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otp.id]);
  
  return true;
}

export async function sendOTP(email: string): Promise<{ success: boolean; message: string }> {
  // Check if user exists and is active
  const user = await queryOne<User>(
    `SELECT * FROM users WHERE email = $1 AND is_active = true`,
    [email]
  );
  
  if (!user) {
    // Don't reveal if user exists or not for security
    return { success: true, message: 'If an account exists, an OTP has been sent.' };
  }
  
  const code = await createOTP(email);
  
  // Send email (skip in development if no SMTP configured)
  if (process.env.SMTP_HOST) {
    await sendOTPEmail(email, code, user.name);
  } else {
    console.log(`[DEV] OTP for ${email}: ${code}`);
  }
  
  return { success: true, message: 'OTP sent to your email.' };
}

export async function loginWithOTP(
  email: string,
  code: string
): Promise<{ success: boolean; token?: string; user?: User; message: string }> {
  const isValid = await verifyOTP(email, code);
  
  if (!isValid) {
    return { success: false, message: 'Invalid or expired OTP.' };
  }
  
  const user = await queryOne<User>(
    `SELECT * FROM users WHERE email = $1 AND is_active = true`,
    [email]
  );
  
  if (!user) {
    return { success: false, message: 'User not found or inactive.' };
  }
  
  const token = generateToken(user);
  
  // Create audit log
  await query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
     VALUES ($1, 'login', 'user', $1)`,
    [user.id]
  );
  
  return { success: true, token, user, message: 'Login successful.' };
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = verifyToken(token);
  if (!payload) return null;
  
  return queryOne<User>(
    `SELECT * FROM users WHERE id = $1 AND is_active = true`,
    [payload.userId]
  );
}

export async function createUser(
  email: string,
  name: string,
  role: 'admin' | 'cleaner' | 'owner',
  phone?: string
): Promise<User> {
  const result = await query<User>(
    `INSERT INTO users (email, name, role, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, name, role, phone || null]
  );
  return result[0];
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
