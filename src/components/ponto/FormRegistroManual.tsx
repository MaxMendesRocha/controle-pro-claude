'use client';

// src/components/ponto/FormRegistroManual.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function FormRegistroManual() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [data, setData] = useState('');
  const [entrada, setEntrada] = useState('');
  const [saida, setSaida] = useState('');
  const [motivo, setMotivo] = useState('');
  const [intervaloNaoUsufruido, setIntervaloNaoUsufruido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const res = await fetch('/api/ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo: 'manual', data, entrada, saida, motivo, intervaloNaoUsufruido }),
    });

    setSalvando(false);

    if (!res.ok) {
      const resData = await res.json();
      setErro(resData.error || 'Erro ao salvar registro');
      return;
    }

    setData(''); setEntrada(''); setSaida(''); setMotivo(''); setIntervaloNaoUsufruido(false);
    setAberto(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        + Registro Manual
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Registro Manual</h3>
          <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600">Fechar</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input required type="date" value={data} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
              <input required type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saida</label>
              <input required type="time" value={saida} onChange={(e) => setSaida(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2}
              placeholder="Ex: Esqueci de bater o ponto"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={intervaloNaoUsufruido}
              onChange={(e) => setIntervaloNaoUsufruido(e.target.checked)}
              className="rounded border-gray-300"
            />
            Intervalo nao foi usufruido neste dia
          </label>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg transition">
              {salvando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}