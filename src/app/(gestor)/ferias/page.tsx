// src/app/(gestor)/ferias/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { calcularPeriodosFeriasCompleto } from '@/lib/calculos/ferias';
import { FiltroFerias } from '@/components/ferias/FiltroFerias';
import { CardPeriodoFerias } from '@/components/ferias/CardPeriodoFerias';
import { ListaGozosFerias } from '@/components/ferias/ListaGozosFerias';
import type { Colaborador, GozoFerias } from '@/types';

export default async function FeriasPage({
  searchParams,
}: {
  searchParams: Promise<{ colaboradorId?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const colaboradoresSnap = await empresaRef.collection('colaboradores').get();
  const colaboradores = colaboradoresSnap.docs
    .map((d) => d.data() as Colaborador)
    .filter((c) => c.role === 'colaborador' && c.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const { colaboradorId } = await searchParams;
  const colaboradorIdFiltro = colaboradorId || colaboradores[0]?.uid || '';
  const colaborador = colaboradores.find((c) => c.uid === colaboradorIdFiltro);

  let gozos: GozoFerias[] = [];
  let periodos: ReturnType<typeof calcularPeriodosFeriasCompleto> = [];

  if (colaborador) {
    const gozosSnap = await empresaRef.collection('feriasGozos').where('colaboradorId', '==', colaborador.uid).get();
    gozos = gozosSnap.docs.map((d) => d.data() as GozoFerias);
    gozos.sort((a, b) => b.inicio.localeCompare(a.inicio));

    const hoje = new Date().toISOString().slice(0, 10);
    periodos = calcularPeriodosFeriasCompleto(colaborador, hoje, gozos);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-foreground">Ferias</h2>
        {colaboradores.length > 0 && (
          <FiltroFerias colaboradores={colaboradores} colaboradorIdAtual={colaboradorIdFiltro} />
        )}
      </div>

      {colaboradores.length === 0 && (
        <div className="text-center py-12 text-faint bg-surface rounded-xl border border-border">
          Nenhum colaborador ativo encontrado
        </div>
      )}

      {colaborador && (
        <div className="space-y-6">
          <div className="space-y-3">
            {periodos
              .slice()
              .reverse()
              .map((periodo) => (
                <CardPeriodoFerias
                  key={periodo.indice}
                  periodo={periodo}
                  colaborador={{ id: colaborador.uid, nome: colaborador.nome }}
                />
              ))}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted mb-2">Historico</h3>
            <ListaGozosFerias gozos={gozos} editavel />
          </div>
        </div>
      )}
    </div>
  );
}
