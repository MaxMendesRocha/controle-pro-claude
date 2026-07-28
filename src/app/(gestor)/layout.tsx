import { getSessionUser } from '@/lib/auth/session';
import { Sidebar, type SidebarNavItem } from '@/components/ui/Sidebar';

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/colaboradores', label: 'Colaboradores', icon: 'colaboradores' },
  { href: '/registros', label: 'Registros de Ponto', icon: 'registros' },
  { href: '/holerites', label: 'Holerites', icon: 'holerites' },
  { href: '/regras', label: 'Regras de Calculo', icon: 'regras' },
];

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  // A rota ja esta protegida pelo middleware; aqui so buscamos o usuario para exibir o e-mail
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={NAV_ITEMS} userEmail={user?.email ?? null} roleLabel="Gestor" accent="gestor" />
      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
