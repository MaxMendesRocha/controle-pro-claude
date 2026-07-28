'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export function ToggleAtivoButton({ uid, ativo }: { uid: string; ativo: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [carregando, setCarregando] = useState(false);

  async function handleClick() {
    setCarregando(true);
    const res = await fetch(`/api/colaboradores/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ativo }),
    });
    setCarregando(false);

    if (!res.ok) {
      showToast('Erro ao atualizar colaborador', 'error');
      return;
    }

    showToast(ativo ? 'Colaborador desativado' : 'Colaborador ativado');
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={carregando}
      className="text-sm text-accent hover:text-accent-ink font-medium disabled:opacity-50"
    >
      {ativo ? 'Desativar' : 'Ativar'}
    </button>
  );
}