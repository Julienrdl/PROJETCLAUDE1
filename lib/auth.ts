import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { UserPayload } from './constants';

export type { UserPayload } from './constants';
export { ROLE_LABELS, STATUS_LABELS, STATUS_COLORS, ROLE_TO_STEP, ROLE_TO_STATUS, NEXT_STATUS } from './constants';

const JWT_SECRET = process.env.JWT_SECRET || 'disolar-secret-key-2024';

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getUserFromRequest(request: NextRequest): UserPayload | null {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
