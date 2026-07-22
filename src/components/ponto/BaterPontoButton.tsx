'use client';

// src/components/ponto/BaterPontoButton.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BaterPontoButton({ tipo }: { tipo: 'entrada' | 'saida' }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [intervaloNaoUsufruido, setIntervaloNaoUsufruido] = useState(false);

  async function handleClick() {
    setErro(null);
    setCarregando(true);

    const res = await fetch('/api/ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, intervaloNaoUsufruido: tipo === 'saida' ? intervaloNaoUsufruido : undefined }),
    });

    setCarregando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || 'Erro ao registrar ponto');
      return;
    }

    router.refresh();
  }

  const isEntrada = tipo === 'entrada';

  return (
    <div>
      {!isEntrada && (
        <label className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={intervaloNaoUsufruido}
            onChange={(e) => setIntervaloNaoUsufruido(e.target.checked)}
            className="rounded border-gray-300"
          />
          Nao fiz o intervalo hoje
        </label>
      )}
      <button
        onClick={handleClick}
        disabled={carregando}
        className={`px-8 py-3 rounded-xl font-semibold text-lg transition shadow-lg text-white disabled:opacity-50 ${
          isEntrada ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {carregando ? 'Registrando...' : isEntrada ? 'Registrar Entrada' : 'Registrar Saida'}
      </button>
      {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
    </div>
  );
}