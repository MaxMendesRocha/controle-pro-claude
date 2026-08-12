// src/app/(colaborador)/minhas-ferias/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { calcularPeriodosFeriasCompleto } from '@/lib/calculos/ferias';
import { CardPeriodoFerias } from '@/components/ferias/CardPeriodoFerias';
import { ListaGozosFerias } from '@/components/ferias/ListaGozosFerias';
import type { Colaborador, GozoFerias } from '@/types';

export default async function MinhasFeriasPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colabDoc, gozosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').doc(user.uid).get(),
    empresaRef.collection('feriasGozos').where('colaboradorId', '==', user.uid).get(),
  ]);

  const colaborador = colabDoc.data() as Colaborador | undefined;
  const gozos = gozosSnap.docs.map((d) => d.data() as GozoFerias).sort((a, b) => b.inicio.localeCompare(a.inicio));

  if (!colaborador) {
    return <p className="text-faint">Nao foi possivel carregar seus dados.</p>;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const periodos = calcularPeriodosFeriasCompleto(colaborador, hoje, gozos);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Minhas Ferias</h2>

      <div className="space-y-3">
        {periodos
          .slice()
          .reverse()
          .map((periodo) => (
            <CardPeriodoFerias key={periodo.indice} periodo={periodo} />
          ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted mb-2">Historico</h3>
        <ListaGozosFerias gozos={gozos} />
      </div>
    </div>
  );
}
