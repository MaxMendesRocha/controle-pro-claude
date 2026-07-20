export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

const GESTOR_PREFIX = '/dashboard';
const GESTOR_PATHS = ['/dashboard', '/colaboradores', '/registros', '/holerites', '/regras'];
const COLABORADOR_PATHS = ['/meu-ponto', '/meus-registros', '/meu-holerite'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGestorPath = GESTOR_PATHS.some((p) => pathname.startsWith(p));
  const isColaboradorPath = COLABORADOR_PATHS.some((p) => pathname.startsWith(p));

  if (!isGestorPath && !isColaboradorPath) {
    return NextResponse.next();
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isGestorPath && user.role !== 'gestor') {
    return NextResponse.redirect(new URL('/meu-ponto', request.url));
  }

  if (isColaboradorPath && user.role !== 'colaborador') {
    return NextResponse.redirect(new URL(GESTOR_PREFIX, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/colaboradores/:path*', '/registros/:path*', '/holerites/:path*', '/regras/:path*', '/meu-ponto/:path*', '/meus-registros/:path*', '/meu-holerite/:path*'],
};