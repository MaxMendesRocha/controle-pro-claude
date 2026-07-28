'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { LogOutIcon } from '@/components/ui/icons';

const VARIANT_CLASSES = {
  light: 'text-gray-500 hover:text-red-600 hover:bg-red-50',
  dark: 'text-slate-400 hover:text-red-400 hover:bg-white/5',
} as const;

export function LogoutButton({ variant = 'light' }: { variant?: keyof typeof VARIANT_CLASSES }) {
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${VARIANT_CLASSES[variant]}`}
      title="Sair"
    >
      <LogOutIcon className="w-4 h-4 shrink-0" />
      Sair
    </button>
  );
}