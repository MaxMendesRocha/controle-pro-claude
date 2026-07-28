// src/app/(colaborador)/meus-registros/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { FiltroMes } from '@/components/ponto/FiltroMes';
import { FormRegistroManual } from '@/components/ponto/FormRegistroManual';
import type { RegistroPonto, Colaborador } from '@/types';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default async function MeusRegistrosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { mes } = await searchParams;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Meus Registros</h2>
        <div className="flex gap-2 items-center">
          <FiltroMes mesAtual={mesFiltro} />
          <FormRegistroManual />
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Saida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Extras</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-faint">Nenhum registro neste mes</td>
                </tr>
              )}
              {registros.map((r, i) => {
                let total = '--:--';
                let extras = '--:--';
                let status = { label: 'Incompleto', cor: 'bg-surface-2 text-muted' };
                let ehDiaExtra = false;

                if (r.entrada && r.saida && colaborador) {
                  const classificacao = classificarHorasRegistro(
                    r.data, r.entrada, r.saida, colaborador, r.intervaloNaoUsufruido ?? false
                  );
                  total = horasParaTexto(classificacao.totalHoras);
                  extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
                  ehDiaExtra = classificacao.ehDiaExtra;
                  status = { label: 'Completo', cor: 'bg-positive-soft text-positive' };
                } else if (r.entrada && !r.saida) {
                  status = { label: 'Em andamento', cor: 'bg-accent-soft text-accent-ink' };
                }

                return (
                  <tr key={i} className="hover:bg-surface-hover transition">
                    <td className="px-6 py-4 text-sm text-foreground">
                      {formatDateBR(r.data)}
                      {ehDiaExtra && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-special-soft text-special">
                          Extra
                        </span>
                      )}
                      {r.intervaloNaoUsufruido && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-soft text-warning">
                          Sem intervalo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{r.entrada ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm text-muted">{r.saida ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{total}</td>
                    <td className="px-6 py-4 text-sm text-warning font-medium">{extras}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cor}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}