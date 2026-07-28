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

  return (
    <>
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Colaborador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Saida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Extras</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {registros.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-faint">Nenhum registro encontrado</td>
                </tr>
              )}
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
                  <tr key={r.id} className="hover:bg-surface-hover transition">
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
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{colaborador?.nome ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-muted">{r.entrada ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm text-muted">{r.saida ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{total}</td>
                    <td className="px-6 py-4 text-sm text-warning font-medium">{extras}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.tipo === 'automatico' ? 'bg-accent-soft text-accent-ink' : 'bg-warning-soft text-warning'
                      }`}>
                        {r.tipo === 'automatico' ? 'Automatico' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditando(r)}
                        className="text-sm text-accent hover:text-accent-ink font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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