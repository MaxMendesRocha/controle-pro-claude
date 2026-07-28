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
      <div className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Cargo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Salario Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Carga Horaria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-faint uppercase">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {colaboradores.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-faint">Nenhum colaborador cadastrado</td>
                </tr>
              )}
              {colaboradores.map((c) => (
                <tr key={c.uid} className="hover:bg-surface-hover transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{c.nome}</p>
                    <p className="text-xs text-faint">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{c.cargo}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {c.salarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{c.cargaHoraria}h/dia</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.ativo ? 'bg-positive-soft text-positive' : 'bg-critical-soft text-critical'
                      }`}
                    >
                      {c.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditando(c)}
                        className="text-sm text-accent hover:text-accent-ink font-medium"
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