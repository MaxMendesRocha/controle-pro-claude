'use client';

// src/components/colaboradores/FormNovoColaborador.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { calcularIntervaloMinutos } from '@/lib/calculos/intervalo';

const DIAS_SEMANA: { valor: number; label: string }[] = [
  { valor: 1, label: 'Seg' },
  { valor: 2, label: 'Ter' },
  { valor: 3, label: 'Qua' },
  { valor: 4, label: 'Qui' },
  { valor: 5, label: 'Sex' },
  { valor: 6, label: 'Sab' },
  { valor: 0, label: 'Dom' },
];

const initialState = {
  nome: '', cpf: '', email: '', cargo: '',
  salarioBase: '', cargaHoraria: '8', admissao: '', banco: '',
};

export function FormNovoColaborador() {
  const router = useRouter();
  const { showToast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(initialState);
  const [diasTrabalho, setDiasTrabalho] = useState<number[]>([1, 2, 3, 4, 5]);
  const [intervaloManual, setIntervaloManual] = useState(false);
  const [duracaoIntervalo, setDuracaoIntervalo] = useState('60');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const minimoLegalIntervalo = calcularIntervaloMinutos(parseFloat(form.cargaHoraria) || 0);

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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

    if (intervaloManual && (parseInt(duracaoIntervalo, 10) || 0) < minimoLegalIntervalo) {
      setErro(`Duracao do intervalo nao pode ser menor que o minimo legal (${minimoLegalIntervalo} min)`);
      return;
    }

    setSalvando(true);

    const res = await fetch('/api/colaboradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        salarioBase: parseFloat(form.salarioBase),
        cargaHoraria: parseFloat(form.cargaHoraria),
        diasTrabalho,
        intervaloManual,
        duracaoIntervaloMinutos: intervaloManual ? parseInt(duracaoIntervalo, 10) : undefined,
      }),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      const mensagem = data.error || 'Erro ao salvar colaborador';
      setErro(mensagem);
      showToast(mensagem, 'error');
      return;
    }

    setForm(initialState);
    setDiasTrabalho([1, 2, 3, 4, 5]);
    setIntervaloManual(false);
    setDuracaoIntervalo('60');
    setAberto(false);
    showToast('Colaborador cadastrado com sucesso');
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg font-medium transition"
      >
        + Novo Colaborador
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground">Novo Colaborador</h3>
          <button onClick={() => setAberto(false)} className="text-faint hover:text-muted">
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Nome Completo *</label>
              <input required value={form.nome} onChange={(e) => update('nome', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">CPF *</label>
              <input required value={form.cpf} onChange={(e) => update('cpf', e.target.value)} placeholder="000.000.000-00"
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Cargo *</label>
              <input required value={form.cargo} onChange={(e) => update('cargo', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Salario Base (R$) *</label>
              <input required type="number" step="0.01" min="0.01" value={form.salarioBase}
                onChange={(e) => update('salarioBase', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Carga Horaria Diaria (h) *</label>
              <input required type="number" step="0.5" min="1" max="12" value={form.cargaHoraria}
                onChange={(e) => update('cargaHoraria', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Data de Admissao *</label>
              <input required type="date" value={form.admissao} onChange={(e) => update('admissao', e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Banco</label>
              <input value={form.banco} onChange={(e) => update('banco', e.target.value)} placeholder="Banco / Ag / Conta"
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">Dias de Trabalho *</label>
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
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-2 text-muted border-border hover:border-accent'
                    }`}
                  >
                    {dia.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-faint mt-1">
              Trabalho fora desses dias (ex: sabado se nao selecionado) e calculado como hora extra com adicional maior
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={intervaloManual}
                onChange={(e) => setIntervaloManual(e.target.checked)}
                className="rounded border-border"
              />
              Colaborador bate ponto do intervalo manualmente
            </label>
            <p className="text-xs text-faint mt-1">
              Em vez do desconto automatico, o colaborador registra a saida e a volta do intervalo.
            </p>

            {intervaloManual && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-muted mb-1">Duracao minima do intervalo (min) *</label>
                <input
                  required
                  type="number"
                  min={minimoLegalIntervalo}
                  step="5"
                  value={duracaoIntervalo}
                  onChange={(e) => setDuracaoIntervalo(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-faint mt-1">
                  Minimo legal para {form.cargaHoraria || '0'}h/dia: {minimoLegalIntervalo} min (Art. 71 CLT).
                </p>
              </div>
            )}
          </div>

          {erro && <p className="text-sm text-critical">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAberto(false)} className="px-4 py-2 text-muted hover:bg-surface-hover rounded-lg transition">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="px-4 py-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-lg transition">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
