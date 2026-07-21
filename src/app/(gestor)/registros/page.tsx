// src/app/(gestor)/registros/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { FiltroRegistros } from '@/components/registros/FiltroRegistros';
import { TabelaRegistros } from '@/components/registros/TabelaRegistros';
import type { Colaborador, RegistroPonto } from '@/types';

export default async function RegistrosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; colaboradorId?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { mes, colaboradorId } = await searchParams;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);
  const colaboradorIdFiltro = colaboradorId || '';

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colaboradoresSnap, registrosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').get(),
    empresaRef.collection('registros').get(),
  ]);

  const colaboradores = colaboradoresSnap.docs
    .map((d) => d.data() as Colaborador)
    .filter((c) => c.role === 'colaborador');

  const colaboradoresPorId: Record<string, Colaborador> = {};
  colaboradores.forEach((c) => { colaboradoresPorId[c.uid] = c; });

  // Importante: o id do registro vem do documento do Firestore (d.id), nao do
  // campo dentro dos dados - registros antigos foram gravados sem esse campo.
  let registros = registrosSnap.docs
    .map((d) => ({ ...d.data(), id: d.id }) as RegistroPonto)
    .filter((r) => r.data.startsWith(mesFiltro));

  if (colaboradorIdFiltro) {
    registros = registros.filter((r) => r.colaboradorId === colaboradorIdFiltro);
  }

  registros.sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Registros de Ponto</h2>
        <FiltroRegistros
          colaboradores={colaboradores}
          mesAtual={mesFiltro}
          colaboradorIdAtual={colaboradorIdFiltro}
        />
      </div>

      <TabelaRegistros registros={registros} colaboradoresPorId={colaboradoresPorId} />
    </div>
  );
}