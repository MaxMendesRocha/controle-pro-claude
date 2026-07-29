'use client';

// src/components/perfil/FormEditarBanco.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export function FormEditarBanco({ bancoInicial }: { bancoInicial: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [banco, setBanco] = useState(bancoInicial);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);

    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banco }),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      showToast(data.error || 'Erro ao salvar', 'error');
      return;
    }

    showToast('Dados bancarios atualizados');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Dados bancarios</p>
      <label className="mb-1 block text-sm font-medium text-muted">Banco / Agencia / Conta</label>
      <input
        value={banco}
        onChange={(e) => setBanco(e.target.value)}
        placeholder="Banco / Ag / Conta"
        className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-accent"
      />
      <p className="mt-1 text-xs text-faint">Usado para referencia no holerite. Voce e o unico que pode editar este campo.</p>
      <button
        type="submit"
        disabled={salvando}
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
      >
        {salvando ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
}
