'use client';

// src/components/regras/RegrasForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RegrasCalculo } from '@/types';

type FormState = Omit<RegrasCalculo, 'empresaId'>;

export function RegrasForm({ regrasIniciais }: { regrasIniciais: RegrasCalculo }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    cargaDiaria: regrasIniciais.cargaDiaria,
    cargaSemanal: regrasIniciais.cargaSemanal,
    toleranciaMinutos: regrasIniciais.toleranciaMinutos,
    heUtilPercent: regrasIniciais.heUtilPercent,
    heDomingoFeriadoPercent: regrasIniciais.heDomingoFeriadoPercent,
    limiteHEMensal: regrasIniciais.limiteHEMensal,
    descontoFaltaPercent: regrasIniciais.descontoFaltaPercent,
    diaFechamento: regrasIniciais.diaFechamento ?? 0,
  });
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function update(campo: keyof FormState, valor: string) {
    setSucesso(false);
    setForm((prev) => ({ ...prev, [campo]: parseFloat(valor) || 0 }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);

    const res = await fetch('/api/regras', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || 'Erro ao salvar regras');
      return;
    }

    setSucesso(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Jornada de Trabalho</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horaria Diaria (horas)</label>
            <input
              type="number" step="0.5" min="1" max="12"
              value={form.cargaDiaria}
              onChange={(e) => update('cargaDiaria', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horaria Semanal (horas)</label>
            <input
              type="number" step="0.5" min="1" max="44"
              value={form.cargaSemanal}
              onChange={(e) => update('cargaSemanal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tolerancia de Atraso (minutos)</label>
            <input
              type="number" min="0" max="60"
              value={form.toleranciaMinutos}
              onChange={(e) => update('toleranciaMinutos', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Horas Extras</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">% Hora Extra (Dias Uteis)</label>
            <input
              type="number" min="50"
              value={form.heUtilPercent}
              onChange={(e) => update('heUtilPercent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Minimo legal: 50% sobre a hora normal (CF art. 7, XVI)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">% Hora Extra (Domingos/Feriados)</label>
            <input
              type="number" min="100"
              value={form.heDomingoFeriadoPercent}
              onChange={(e) => update('heDomingoFeriadoPercent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite Mensal de HE (horas)</label>
            <input
              type="number" min="0" max="80"
              value={form.limiteHEMensal}
              onChange={(e) => update('limiteHEMensal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Descontos</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">INSS</p>
              <p className="text-xs text-gray-500">Aliquota progressiva conforme tabela oficial</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Ativo</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto de Faltas (% do dia)</label>
            <input
              type="number" min="0" max="100"
              value={form.descontoFaltaPercent}
              onChange={(e) => update('descontoFaltaPercent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fechamento da Folha</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Fechamento</label>
            <input
              type="number" min="0" max="28"
              value={form.diaFechamento}
              onChange={(e) => update('diaFechamento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = mes calendario (padrao). Ex: 25 = periodo fecha todo dia 25, comecando no dia 26 do mes anterior.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between lg:col-span-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Salvar Alteracoes</h3>
          <p className="text-sm text-gray-500 mb-4">
            Essas regras valem para o calculo de todos os holerites gerados a partir de agora.
            Holerites ja gerados nao sao recalculados automaticamente.
          </p>
        </div>
        <div>
          {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}
          {sucesso && <p className="text-sm text-emerald-600 mb-3">Regras salvas com sucesso!</p>}
          <button
            type="submit"
            disabled={salvando}
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg transition"
          >
            {salvando ? 'Salvando...' : 'Salvar Regras'}
          </button>
        </div>
      </div>
    </form>
  );
}