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
      <div className="flex flex-col items-start gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Meus Registros</h2>
        <div className="flex flex-wrap gap-2 items-center">
          <FiltroMes mesAtual={mesFiltro} />
          <FormRegistroManual />
        </div>
      </div>

      {registros.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-faint">
          Nenhum registro neste mes
        </div>
      ) : (
        <div className="space-y-3">
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
              <div key={i} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{formatDateBR(r.data)}</p>
                    {(ehDiaExtra || r.intervaloNaoUsufruido) && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ehDiaExtra && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-special-soft text-special">
                            Extra
                          </span>
                        )}
                        {r.intervaloNaoUsufruido && (
                          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-warning-soft text-warning">
                            Sem intervalo
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${status.cor}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-faint">Entrada</p>
                    <p className="text-sm text-muted">{r.entrada ?? '--:--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-faint">Saida</p>
                    <p className="text-sm text-muted">{r.saida ?? '--:--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-faint">Total</p>
                    <p className="text-sm font-medium text-foreground">{total}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-faint">Extras</p>
                    <p className="text-sm font-medium text-warning">{extras}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}