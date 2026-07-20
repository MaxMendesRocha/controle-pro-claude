// src/lib/auth/session.ts
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';
import type { Role } from '@/types';

const SESSION_COOKIE_NAME = 'pontopro_session';
const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 dias

export interface SessionUser {
  uid: string;
  email: string | null;
  role: Role;
  empresaId: string;
}

/**
 * Cria um cookie de sessão a partir de um ID token do client.
 * Usado pela API route /api/session logo apos o login.
 */
export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS });
}

export { SESSION_COOKIE_NAME, SESSION_EXPIRES_IN_MS };

/**
 * Le e valida a sessao atual a partir do cookie httpOnly.
 * So pode ser chamado em Server Components, Route Handlers ou Server Actions.
 * Retorna null se nao houver sessao valida (nao lanca erro).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = decoded.role as Role | undefined;
    const empresaId = decoded.empresaId as string | undefined;

    if (!role || !empresaId) return null;

    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role,
      empresaId,
    };
  } catch {
    // cookie expirado, revogado ou invalido
    return null;
  }
}