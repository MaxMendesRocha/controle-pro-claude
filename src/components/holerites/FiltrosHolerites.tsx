'use client';

// src/components/holerites/FiltrosHolerites.tsx
import type { Colaborador } from '@/types';

export function FiltrosHolerites({
  colaboradores,
  mesAtual,
  colaboradorIdAtual,
}: {
  colaboradores: Colaborador[];
  mesAtual: string;
  colaboradorIdAtual: string;
}) {
  return (
    <form className="flex gap-2">
      <select
        name="colaboradorId"
        defaultValue={colaboradorIdAtual}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option value="">Todos</option>
        {colaboradores.map((c) => (
          <option key={c.uid} value={c.uid}>{c.nome}</option>
        ))}
      </select>
      <input
        type="month"
        name="mes"
        defaultValue={mesAtual}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </form>
  );
}
