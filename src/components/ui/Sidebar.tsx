// src/components/ui/Sidebar.tsx
'use client';

import { useState, type ComponentType } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { MenuIcon, CloseIcon } from '@/components/ui/icons';

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type Accent = 'blue' | 'emerald';

const ACCENT_STYLES: Record<Accent, { activeBg: string; ring: string; dot: string }> = {
  blue: { activeBg: 'bg-blue-600', ring: 'ring-blue-500/40', dot: 'bg-blue-400' },
  emerald: { activeBg: 'bg-emerald-600', ring: 'ring-emerald-500/40', dot: 'bg-emerald-400' },
};

export function Sidebar({
  navItems,
  accent,
  roleLabel,
  userEmail,
}: {
  navItems: NavItem[];
  accent: Accent;
  roleLabel: string;
  userEmail: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const styles = ACCENT_STYLES[accent];

  function isActive(href: string) {
    return pathname === href || pathname?.startsWith(`${href}/`);
  }

  const nav = (
    <>
      <div className="flex items-center gap-3 px-5 h-16 shrink-0">
        <Image src="/pontopro-logo-compacto.png" alt="PontoPro" width={100} height={53} priority />
      </div>

      <div className="px-5 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-300 bg-white/5 rounded-full px-2.5 py-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          {roleLabel}
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active ? `${styles.activeBg} text-white shadow-sm` : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 pt-3 border-t border-white/10">
        {userEmail && <p className="px-3 mb-2 text-xs text-slate-400 truncate">{userEmail}</p>}
        <LogoutButton variant="dark" />
      </div>
    </>
  );

  return (
    <>
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 h-14">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="p-2 -ml-2 text-slate-300 hover:text-white"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <Image src="/pontopro-logo-compacto.png" alt="PontoPro" width={84} height={44} priority />
        <div className="w-10" />
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[80vw] h-full bg-slate-900 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
              className="self-end p-2 mr-3 mt-3 text-slate-300 hover:text-white"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            {nav}
          </div>
          <button
            aria-label="Fechar menu"
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}

      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:h-screen md:sticky md:top-0 bg-slate-900">
        {nav}
      </aside>
    </>
  );
}
