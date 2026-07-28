import { getSessionUser } from '@/lib/auth/session';
import { Sidebar, type SidebarNavItem } from '@/components/ui/Sidebar';

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/meu-ponto', label: 'Meu Ponto', icon: 'registros' },
  { href: '/meus-registros', label: 'Meus Registros', icon: 'lista' },
  { href: '/meu-holerite', label: 'Meu Holerite', icon: 'holerites' },
];

export default async function ColaboradorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={NAV_ITEMS} userEmail={user?.email ?? null} roleLabel="Colaborador" accent="colaborador" />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
