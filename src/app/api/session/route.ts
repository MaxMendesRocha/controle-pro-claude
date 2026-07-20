import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie, SESSION_COOKIE_NAME, SESSION_EXPIRES_IN_MS } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'idToken ausente' }, { status: 400 });
  }

  try {
    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Nao foi possivel criar a sessao' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}