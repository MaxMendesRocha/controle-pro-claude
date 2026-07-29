// src/components/ui/AppShell.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Icon, type IconName } from '@/components/ui/icons';

export interface AppNavItem {
  href: string;
  label: string;
  icon: IconName;
}

interface AppShellProps {
  items: AppNavItem[];
  userEmail: string | null;
  roleLabel: string;
  accent: 'gestor' | 'colaborador';
  children: React.ReactNode;
}

export function AppShell({ items, userEmail, roleLabel, accent, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut(auth);
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  const active = items.find((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`));
  const activeTextClass = accent === 'gestor' ? 'text-accent-ink' : 'text-positive';
  const activePillClass = accent === 'gestor' ? 'bg-accent-soft text-accent-ink' : 'bg-positive-soft text-positive';
  const initials = (userEmail ?? roleLabel).slice(0, 2).toUpperCase();
  const perfilHref = accent === 'gestor' ? '/perfil' : '/meu-perfil';
  const isPerfil = pathname === perfilHref || pathname?.startsWith(`${perfilHref}/`);

  return (
    <div className="flex min-h-dvh justify-center bg-surface-2 md:py-6">
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background md:h-[calc(100dvh-3rem)] md:max-w-sm md:rounded-[2.5rem] md:border md:border-border md:shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image src="/pontopro-logo-icone.png" alt="" width={28} height={28} className="shrink-0" priority />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{isPerfil ? 'Meu Perfil' : active?.label ?? roleLabel}</p>
              <p className="text-xs text-faint">{roleLabel}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={perfilHref}
              title="Meu perfil"
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-opacity hover:opacity-80 ${activePillClass}`}
            >
              {initials}
            </Link>
            <button
              onClick={handleLogout}
              title="Sair"
              aria-label="Sair"
              className="flex h-9 w-9 items-center justify-center rounded-full text-faint transition-colors hover:bg-critical-soft hover:text-critical"
            >
              <Icon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5">{children}</main>

        <nav className="flex shrink-0 items-stretch justify-around border-t border-border bg-surface px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? activeTextClass : 'text-faint hover:text-muted'
                }`}
              >
                <Icon name={item.icon} className="h-[22px] w-[22px]" />
                <span className="truncate px-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
