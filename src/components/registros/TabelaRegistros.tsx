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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colaborador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extras</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registros.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">Nenhum registro encontrado</td>
                </tr>
              )}
              {registros.map((r) => {
                const colaborador = colaboradoresPorId[r.colaboradorId];
                let total = '--:--';
                let extras = '--:--';
                let ehDiaExtra = false;

                if (r.entrada && r.saida && colaborador) {
                  const classificacao = classificarHorasRegistro(r.data, r.entrada, r.saida, colaborador);
                  total = horasParaTexto(classificacao.totalHoras);
                  extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
                  ehDiaExtra = classificacao.ehDiaExtra;
                }

                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateBR(r.data)}
                      {ehDiaExtra && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                          Extra
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{colaborador?.nome ?? 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.entrada ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.saida ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{total}</td>
                    <td className="px-6 py-4 text-sm text-amber-600 font-medium">{extras}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.tipo === 'automatico' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.tipo === 'automatico' ? 'Automatico' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditando(r)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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