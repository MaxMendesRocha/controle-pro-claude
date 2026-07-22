import Link from 'next/link';
import { getSessionUser } from '@/lib/auth/session';
import { LogoutButton } from '@/components/ui/LogoutButton';
import { LogoIcon } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { href: '/meu-ponto', label: 'Meu Ponto' },
  { href: '/meus-registros', label: 'Meus Registros' },
  { href: '/meu-holerite', label: 'Meu Holerite' },
];

export default async function ColaboradorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <LogoIcon size={36} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">PontoPro</h1>
                <p className="text-xs text-gray-500">{user?.email ?? 'Colaborador'}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-emerald-600 whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}