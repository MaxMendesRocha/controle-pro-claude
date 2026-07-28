'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  colaboradores: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  registros: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  holerites: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6" />
      <path d="M9 11h2" />
    </>
  ),
  regras: (
    <>
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 9v3l2 2" />
      <path d="M4.9 4.9 3 3M20 3l-1.9 1.9" />
    </>
  ),
  lista: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
} as const;

export type SidebarIcon = keyof typeof ICONS;

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: SidebarIcon;
}

interface SidebarProps {
  items: SidebarNavItem[];
  userEmail: string | null;
  roleLabel: string;
  accent: 'gestor' | 'colaborador';
}

export function Sidebar({ items, userEmail, roleLabel, accent }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  function toggleCollapsed() {
    setCollapsed((prev) => !prev);
  }

  async function handleLogout() {
    await signOut(auth);
    await fetch('/api/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  const activeBg = accent === 'gestor' ? 'bg-accent-soft text-accent-ink' : 'bg-positive-soft text-positive';
  const initials = (userEmail ?? roleLabel).slice(0, 2).toUpperCase();

  return (
    <aside
      className={`sticky top-0 flex h-screen shrink-0 flex-col gap-6 border-r border-border bg-surface px-3 py-5 transition-[width] duration-200 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      <div className={`flex items-center gap-2 px-2 ${collapsed ? 'justify-center' : ''}`}>
        <Image src="/pontopro-logo-icone.png" alt="" width={26} height={26} priority className="shrink-0" />
        {!collapsed && (
          <span className="text-[17px] font-extrabold tracking-tight">
            <span className="text-accent-ink">Ponto</span>
            <span className="text-positive">Pro</span>
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? activeBg : 'text-muted hover:bg-surface-hover hover:text-foreground'
              } ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px] shrink-0"
              >
                {ICONS[item.icon]}
              </svg>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2">
        <button
          onClick={toggleCollapsed}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-faint hover:bg-surface-hover hover:text-muted ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
            {collapsed ? <path d="m9 6 6 6-6 6" /> : <path d="m15 6-6 6 6 6" />}
          </svg>
          {!collapsed && <span>Recolher</span>}
        </button>

        <div className={`flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[11px] font-bold text-accent-ink">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{userEmail ?? roleLabel}</p>
              <p className="text-[11px] text-faint">{roleLabel}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            className={`shrink-0 rounded-md p-1.5 text-faint hover:bg-critical-soft hover:text-critical ${collapsed ? 'hidden' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
