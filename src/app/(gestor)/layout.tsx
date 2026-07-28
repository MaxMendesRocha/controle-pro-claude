import { getSessionUser } from '@/lib/auth/session';
import { Sidebar, type NavItem } from '@/components/ui/Sidebar';
import { DashboardIcon, UsersIcon, ClockIcon, ReceiptIcon, SlidersIcon } from '@/components/ui/icons';

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/colaboradores', label: 'Colaboradores', icon: UsersIcon },
  { href: '/registros', label: 'Registros de Ponto', icon: ClockIcon },
  { href: '/holerites', label: 'Holerites', icon: ReceiptIcon },
  { href: '/regras', label: 'Regras de Calculo', icon: SlidersIcon },
];

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  // A rota ja esta protegida pelo middleware; aqui so buscamos o usuario para exibir o e-mail
  const user = await getSessionUser();

  return (
    <div className="min-h-screen md:flex bg-slate-50">
      <Sidebar navItems={NAV_ITEMS} accent="blue" roleLabel="Gestor" userEmail={user?.email ?? null} />
      <div className="flex-1 min-w-0">
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
