'use client';

// src/components/holerites/GerarHoleritesButton.tsx
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function GerarHoleritesButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesAtual = searchParams.get('mes') || new Date().toISOString().slice(0, 7);

  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<{ nome: string; avisos: string[] }[]>([]);

  async function handleClick() {
    setErro(null);
    setAvisos([]);
    setGerando(true);

    const res = await fetch('/api/holerites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mes: mesAtual }),
    });

    const data = await res.json();
    setGerando(false);

    if (!res.ok) {
      setErro(data.error || 'Erro ao gerar holerites');
      return;
    }

    const comAvisos = (data.resultados as { nome: string; avisos: string[] }[]).filter(
      (r) => r.avisos.length > 0
    );
    setAvisos(comAvisos);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={gerando}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        {gerando ? 'Gerando...' : 'Gerar Todos'}
      </button>

      {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}

      {avisos.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="font-medium text-amber-800 mb-1">Avisos na geracao:</p>
          {avisos.map((a) => (
            <div key={a.nome} className="text-amber-700">
              <span className="font-medium">{a.nome}:</span> {a.avisos.join('; ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
