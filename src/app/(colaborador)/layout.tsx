import { getSessionUser } from '@/lib/auth/session';
import { AppShell, type AppNavItem } from '@/components/ui/AppShell';

const NAV_ITEMS: AppNavItem[] = [
  { href: '/meu-ponto', label: 'Meu Ponto', icon: 'registros' },
  { href: '/meus-registros', label: 'Registros', icon: 'lista' },
  { href: '/meu-holerite', label: 'Holerite', icon: 'holerites' },
  { href: '/minhas-ferias', label: 'Ferias', icon: 'ferias' },
];

export default async function ColaboradorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <AppShell items={NAV_ITEMS} userEmail={user?.email ?? null} roleLabel="Colaborador" accent="colaborador">
      {children}
    </AppShell>
  );
}
