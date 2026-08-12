'use client';

// src/components/ferias/ListaGozosFerias.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { GozoFerias } from '@/types';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function ListaGozosFerias({
  gozos,
  editavel = false,
}: {
  gozos: GozoFerias[];
  /** true apenas na visao do gestor - habilita exclusao */
  editavel?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  if (gozos.length === 0) {
    return <p className="text-sm text-faint">Nenhuma ferias registrada ainda.</p>;
  }

  async function handleExcluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir este registro de ferias?')) return;

    setExcluindoId(id);
    const res = await fetch(`/api/ferias/${id}`, { method: 'DELETE' });
    setExcluindoId(null);

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || 'Erro ao excluir', 'error');
      return;
    }

    showToast('Registro de ferias excluido');
    router.refresh();
  }

  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-2">
      {gozos.map((g) => (
        <div key={g.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {formatDateBR(g.inicio)} a {formatDateBR(g.fim)} <span className="text-faint font-normal">({g.dias}d)</span>
            </p>
            <p className="text-xs text-faint">
              Periodo {g.periodoIndice + 1}{g.observacao ? ` - ${g.observacao}` : ''}
            </p>
            {g.valorTotal !== undefined && (
              <p className="text-xs text-muted mt-0.5">
                {currency(g.valorTotal)} <span className="text-faint">(inclui 1/3 constitucional)</span>
                {g.pagamentoEmDobro && (
                  <span className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-critical-soft text-critical">
                    Dobrado - Art. 137 CLT
                  </span>
                )}
              </p>
            )}
          </div>
          {editavel && (
            <button
              onClick={() => handleExcluir(g.id)}
              disabled={excluindoId === g.id}
              className="shrink-0 text-sm font-medium text-critical hover:opacity-80 disabled:opacity-50"
            >
              {excluindoId === g.id ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
