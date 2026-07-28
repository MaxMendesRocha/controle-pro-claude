import { getSessionUser } from '@/lib/auth/session';
import { AppShell, type AppNavItem } from '@/components/ui/AppShell';

const NAV_ITEMS: AppNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/colaboradores', label: 'Equipe', icon: 'colaboradores' },
  { href: '/registros', label: 'Ponto', icon: 'registros' },
  { href: '/holerites', label: 'Holerites', icon: 'holerites' },
  { href: '/regras', label: 'Regras', icon: 'regras' },
];

export default async function GestorLayout({ children }: { children: React.ReactNode }) {
  // A rota ja esta protegida pelo middleware; aqui so buscamos o usuario para exibir o e-mail
  const user = await getSessionUser();

  return (
    <AppShell items={NAV_ITEMS} userEmail={user?.email ?? null} roleLabel="Gestor" accent="gestor">
      {children}
    </AppShell>
  );
}
