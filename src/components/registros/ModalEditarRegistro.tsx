'use client';

// src/components/registros/ModalEditarRegistro.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RegistroPonto } from '@/types';

export function ModalEditarRegistro({
  registro,
  colaboradorNome,
  onClose,
}: {
  registro: RegistroPonto;
  colaboradorNome: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [entrada, setEntrada] = useState(registro.entrada || '');
  const [saida, setSaida] = useState(registro.saida || '');
  const [motivo, setMotivo] = useState('');
  const [intervaloNaoUsufruido, setIntervaloNaoUsufruido] = useState(Boolean(registro.intervaloNaoUsufruido));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const res = await fetch(`/api/registros/${registro.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entrada, saida, motivo, intervaloNaoUsufruido }),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || 'Erro ao salvar');
      return;
    }

    router.refresh();
    onClose();
  }

  async function handleExcluir() {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;

    setExcluindo(true);
    const res = await fetch(`/api/registros/${registro.id}`, { method: 'DELETE' });
    setExcluindo(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || 'Erro ao excluir');
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Editar Registro de Ponto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Fechar</button>
        </div>

        <form onSubmit={handleSalvar} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
            <p className="text-gray-900 font-medium">{colaboradorNome}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <p className="text-gray-900">{registro.data.split('-').reverse().join('/')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
              <input required type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saida</label>
              <input required type="time" value={saida} onChange={(e) => setSaida(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Edicao *</label>
            <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2}
              placeholder="Ex: Correcao de horario"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {registro.editadoPor && (
            <p className="text-xs text-gray-400">
              Ultima edicao: {registro.editadoEm ? new Date(registro.editadoEm).toLocaleString('pt-BR') : ''}
            </p>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleExcluir}
              disabled={excluindo}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition">
                {salvando ? 'Salvando...' : 'Salvar Alteracoes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}