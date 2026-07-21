'use client';

// src/components/colaboradores/ModalEditarColaborador.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Colaborador } from '@/types';

const DIAS_SEMANA: { valor: number; label: string }[] = [
  { valor: 1, label: 'Seg' },
  { valor: 2, label: 'Ter' },
  { valor: 3, label: 'Qua' },
  { valor: 4, label: 'Qui' },
  { valor: 5, label: 'Sex' },
  { valor: 6, label: 'Sab' },
  { valor: 0, label: 'Dom' },
];

export function ModalEditarColaborador({
  colaborador,
  onClose,
}: {
  colaborador: Colaborador;
  onClose: () => void;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(colaborador.nome);
  const [cargo, setCargo] = useState(colaborador.cargo);
  const [salarioBase, setSalarioBase] = useState(String(colaborador.salarioBase));
  const [cargaHoraria, setCargaHoraria] = useState(String(colaborador.cargaHoraria));
  const [banco, setBanco] = useState(colaborador.banco || '');
  const [diasTrabalho, setDiasTrabalho] = useState<number[]>(colaborador.diasTrabalho || [1, 2, 3, 4, 5]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function toggleDia(valor: number) {
    setDiasTrabalho((prev) =>
      prev.includes(valor) ? prev.filter((d) => d !== valor) : [...prev, valor].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (diasTrabalho.length === 0) {
      setErro('Selecione ao menos um dia de trabalho');
      return;
    }

    setSalvando(true);

    const res = await fetch(`/api/colaboradores/${colaborador.uid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        cargo,
        salarioBase: parseFloat(salarioBase),
        cargaHoraria: parseFloat(cargaHoraria),
        banco,
        diasTrabalho,
      }),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || 'Erro ao salvar alteracoes');
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Editar Colaborador</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">Fechar</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
            <p><span className="font-medium text-gray-700">Email:</span> {colaborador.email}</p>
            <p><span className="font-medium text-gray-700">CPF:</span> {colaborador.cpf}</p>
            <p className="text-xs mt-1">Email e CPF nao podem ser alterados por aqui.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
            <input required value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
            <input required value={cargo} onChange={(e) => setCargo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario Base (R$) *</label>
              <input required type="number" step="0.01" min="0.01" value={salarioBase}
                onChange={(e) => setSalarioBase(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horaria Diaria (h) *</label>
              <input required type="number" step="0.5" min="1" max="12" value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
            <input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Banco / Ag / Conta"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dias de Trabalho *</label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => {
                const selecionado = diasTrabalho.includes(dia.valor);
                return (
                  <button
                    key={dia.valor}
                    type="button"
                    onClick={() => toggleDia(dia.valor)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      selecionado
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition">
              {salvando ? 'Salvando...' : 'Salvar Alteracoes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}