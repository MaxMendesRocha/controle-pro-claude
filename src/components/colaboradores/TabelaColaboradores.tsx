'use client';

// src/components/colaboradores/TabelaColaboradores.tsx
import { useState } from 'react';
import { ToggleAtivoButton } from './ToggleAtivoButton';
import { ModalEditarColaborador } from '../../app/api/colaboradores/ModalEditarColaborador';
import type { Colaborador } from '@/types';

export function TabelaColaboradores({ colaboradores }: { colaboradores: Colaborador[] }) {
  const [editando, setEditando] = useState<Colaborador | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salario Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carga Horaria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {colaboradores.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum colaborador cadastrado</td>
                </tr>
              )}
              {colaboradores.map((c) => (
                <tr key={c.uid} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{c.nome}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.cargo}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {c.salarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.cargaHoraria}h/dia</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditando(c)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Editar
                      </button>
                      <ToggleAtivoButton uid={c.uid} ativo={c.ativo} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editando && (
        <ModalEditarColaborador colaborador={editando} onClose={() => setEditando(null)} />
      )}
    </>
  );
}