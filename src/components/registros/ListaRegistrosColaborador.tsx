'use client';

// src/components/registros/ListaRegistrosColaborador.tsx
import { useState } from 'react';
import { horasParaTexto } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { ModalCompletarIntervalo } from './ModalCompletarIntervalo';
import type { RegistroPonto, Colaborador } from '@/types';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function ListaRegistrosColaborador({
  registros,
  colaborador,
}: {
  registros: RegistroPonto[];
  colaborador: Colaborador | undefined;
}) {
  const [completando, setCompletando] = useState<RegistroPonto | null>(null);

  if (registros.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-faint">
        Nenhum registro neste mes
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {registros.map((r) => {
          let total = '--:--';
          let extras = '--:--';
          let status = { label: 'Incompleto', cor: 'bg-surface-2 text-muted' };
          let ehDiaExtra = false;
          let faltamBatidasIntervalo = false;
          let intervaloAbaixoDoMinimo = false;

          if (r.entrada && r.saida && colaborador) {
            const classificacao = classificarHorasRegistro(
              r.data, r.entrada, r.saida, colaborador, r.intervaloNaoUsufruido ?? false,
              r.saidaIntervalo, r.voltaIntervalo
            );
            total = horasParaTexto(classificacao.totalHoras);
            extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
            ehDiaExtra = classificacao.ehDiaExtra;
            faltamBatidasIntervalo = classificacao.faltamBatidasIntervalo;
            intervaloAbaixoDoMinimo = classificacao.intervaloAbaixoDoMinimo;
            status = { label: 'Completo', cor: 'bg-positive-soft text-positive' };
          } else if (r.entrada && !r.saida) {
            status = { label: 'Em andamento', cor: 'bg-accent-soft text-accent-ink' };
          }

          return (
            <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{formatDateBR(r.data)}</p>
                  {(ehDiaExtra || r.intervaloNaoUsufruido || faltamBatidasIntervalo || intervaloAbaixoDoMinimo) && (
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
                      {faltamBatidasIntervalo && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-warning-soft text-warning">
                          Faltam batidas
                        </span>
                      )}
                      {intervaloAbaixoDoMinimo && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-critical-soft text-critical">
                          Intervalo curto
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

              {colaborador?.intervaloManual && (r.saidaIntervalo || r.voltaIntervalo) && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-faint">Saida Intervalo</p>
                    <p className="text-sm text-muted">{r.saidaIntervalo ?? '--:--'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-faint">Volta Intervalo</p>
                    <p className="text-sm text-muted">{r.voltaIntervalo ?? '--:--'}</p>
                  </div>
                </div>
              )}

              {faltamBatidasIntervalo && (
                <div className="mt-3 border-t border-border pt-3">
                  <button
                    onClick={() => setCompletando(r)}
                    className="text-sm font-medium text-accent hover:text-accent-ink"
                  >
                    Completar batidas do intervalo
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completando && (
        <ModalCompletarIntervalo registro={completando} onClose={() => setCompletando(null)} />
      )}
    </>
  );
}
