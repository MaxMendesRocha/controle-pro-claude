// src/app/page.tsx
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';

export default async function RootPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  redirect(user.role === 'gestor' ? '/dashboard' : '/meu-ponto');
}