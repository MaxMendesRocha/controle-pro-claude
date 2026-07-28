'use client';

// src/components/registros/TabelaRegistros.tsx
import { useState } from 'react';
import { horasParaTexto } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { ModalEditarRegistro } from './ModalEditarRegistro';
import type { RegistroPonto, Colaborador } from '@/types';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function TabelaRegistros({
  registros,
  colaboradoresPorId,
}: {
  registros: RegistroPonto[];
  colaboradoresPorId: Record<string, Colaborador>;
}) {
  const [editando, setEditando] = useState<RegistroPonto | null>(null);

  if (registros.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-faint">
        Nenhum registro encontrado
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {registros.map((r) => {
          const colaborador = colaboradoresPorId[r.colaboradorId];
          let total = '--:--';
          let extras = '--:--';
          let ehDiaExtra = false;

          if (r.entrada && r.saida && colaborador) {
            const classificacao = classificarHorasRegistro(
              r.data, r.entrada, r.saida, colaborador, r.intervaloNaoUsufruido ?? false
            );
            total = horasParaTexto(classificacao.totalHoras);
            extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
            ehDiaExtra = classificacao.ehDiaExtra;
          }

          return (
            <div key={r.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{formatDateBR(r.data)}</p>
                  <p className="truncate text-xs text-faint">{colaborador?.nome ?? 'N/A'}</p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
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

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    r.tipo === 'automatico' ? 'bg-accent-soft text-accent-ink' : 'bg-warning-soft text-warning'
                  }`}
                >
                  {r.tipo === 'automatico' ? 'Automatico' : 'Manual'}
                </span>
                <button
                  onClick={() => setEditando(r)}
                  className="text-sm font-medium text-accent hover:text-accent-ink"
                >
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editando && (
        <ModalEditarRegistro
          registro={editando}
          colaboradorNome={colaboradoresPorId[editando.colaboradorId]?.nome ?? 'Desconhecido'}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}
