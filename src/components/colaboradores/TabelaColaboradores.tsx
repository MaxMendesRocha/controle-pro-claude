'use client';

// src/components/colaboradores/TabelaColaboradores.tsx
import { useState } from 'react';
import { ToggleAtivoButton } from './ToggleAtivoButton';
import { ModalEditarColaborador } from '../../app/api/colaboradores/ModalEditarColaborador';
import type { Colaborador } from '@/types';

export function TabelaColaboradores({ colaboradores }: { colaboradores: Colaborador[] }) {
  const [editando, setEditando] = useState<Colaborador | null>(null);

  if (colaboradores.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-faint">
        Nenhum colaborador cadastrado
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {colaboradores.map((c) => (
          <div key={c.uid} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{c.nome}</p>
                <p className="truncate text-xs text-faint">{c.email}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  c.ativo ? 'bg-positive-soft text-positive' : 'bg-critical-soft text-critical'
                }`}
              >
                {c.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-[11px] text-faint">Cargo</p>
                <p className="truncate text-muted">{c.cargo}</p>
              </div>
              <div>
                <p className="text-[11px] text-faint">Salario</p>
                <p className="truncate font-medium text-foreground">
                  {c.salarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-faint">Carga horaria</p>
                <p className="truncate text-muted">{c.cargaHoraria}h/dia</p>
              </div>
            </div>

            <div className="mt-3 flex gap-4 border-t border-border pt-3">
              <button
                onClick={() => setEditando(c)}
                className="text-sm font-medium text-accent hover:text-accent-ink"
              >
                Editar
              </button>
              <ToggleAtivoButton uid={c.uid} ativo={c.ativo} />
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <ModalEditarColaborador colaborador={editando} onClose={() => setEditando(null)} />
      )}
    </>
  );
}
