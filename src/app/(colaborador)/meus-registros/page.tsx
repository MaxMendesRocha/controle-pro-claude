// src/app/(colaborador)/meus-registros/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { FiltroMes } from '@/components/ponto/FiltroMes';
import { FormRegistroManual } from '@/components/ponto/FormRegistroManual';
import { Paginacao } from '@/components/registros/Paginacao';
import { ListaRegistrosColaborador } from '@/components/registros/ListaRegistrosColaborador';
import type { RegistroPonto, Colaborador } from '@/types';

const REGISTROS_POR_PAGINA = 12;

export default async function MeusRegistrosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; pagina?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { mes, pagina } = await searchParams;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);
  const paginaFiltro = Math.max(1, Number(pagina) || 1);

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colabDoc, registrosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').doc(user.uid).get(),
    empresaRef
      .collection('registros')
      .where('colaboradorId', '==', user.uid)
      .get(),
  ]);

  const colaborador = colabDoc.data() as Colaborador | undefined;
  const registros = registrosSnap.docs
    .map((d) => d.data() as RegistroPonto)
    .filter((r) => r.data.startsWith(mesFiltro))
    .sort((a, b) => b.data.localeCompare(a.data));

  const totalPaginas = Math.max(1, Math.ceil(registros.length / REGISTROS_POR_PAGINA));
  const paginaAtual = Math.min(paginaFiltro, totalPaginas);
  const registrosDaPagina = registros.slice(
    (paginaAtual - 1) * REGISTROS_POR_PAGINA,
    paginaAtual * REGISTROS_POR_PAGINA
  );

  function criarHref(pagina: number) {
    const params = new URLSearchParams();
    params.set('mes', mesFiltro);
    if (pagina > 1) params.set('pagina', String(pagina));
    return `/meus-registros?${params.toString()}`;
  }

  return (
    <div>
      <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Meus Registros</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <FiltroMes mesAtual={mesFiltro} />
          <FormRegistroManual />
        </div>
      </div>

      <ListaRegistrosColaborador registros={registrosDaPagina} colaborador={colaborador} />

      <div className="mt-4">
        <Paginacao paginaAtual={paginaAtual} totalPaginas={totalPaginas} criarHref={criarHref} />
      </div>
    </div>
  );
}