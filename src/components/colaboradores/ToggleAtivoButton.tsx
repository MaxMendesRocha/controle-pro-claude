'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ToggleAtivoButton({ uid, ativo }: { uid: string; ativo: boolean }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);

  async function handleClick() {
    setCarregando(true);
    await fetch(`/api/colaboradores/${uid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ativo }),
    });
    setCarregando(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={carregando}
      className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
    >
      {ativo ? 'Desativar' : 'Ativar'}
    </button>
  );
}