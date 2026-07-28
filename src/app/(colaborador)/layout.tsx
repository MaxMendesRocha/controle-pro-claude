import { getSessionUser } from '@/lib/auth/session';
import { Sidebar, type NavItem } from '@/components/ui/Sidebar';
import { ClockIcon, ListIcon, ReceiptIcon } from '@/components/ui/icons';

const NAV_ITEMS: NavItem[] = [
  { href: '/meu-ponto', label: 'Meu Ponto', icon: ClockIcon },
  { href: '/meus-registros', label: 'Meus Registros', icon: ListIcon },
  { href: '/meu-holerite', label: 'Meu Holerite', icon: ReceiptIcon },
];

export default async function ColaboradorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen md:flex bg-slate-50">
      <Sidebar navItems={NAV_ITEMS} accent="emerald" roleLabel="Colaborador" userEmail={user?.email ?? null} />
      <div className="flex-1 min-w-0">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
