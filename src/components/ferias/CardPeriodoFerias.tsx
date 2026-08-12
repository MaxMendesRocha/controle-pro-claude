'use client';

// src/components/ferias/CardPeriodoFerias.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { PeriodoFerias } from '@/lib/calculos/ferias';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

const STATUS_INFO: Record<PeriodoFerias['status'], { label: string; cor: string }> = {
  aquisitivo: { label: 'Em aquisicao', cor: 'bg-surface-2 text-muted' },
  concessivo: { label: 'Pode ser concedido', cor: 'bg-accent-soft text-accent-ink' },
  vencido: { label: 'Vencido', cor: 'bg-critical-soft text-critical' },
};

export function CardPeriodoFerias({
  periodo,
  colaborador,
}: {
  periodo: PeriodoFerias;
  /** presente apenas na visao do gestor - habilita o botao de registrar gozo */
  colaborador?: { id: string; nome: string };
}) {
  const [registrando, setRegistrando] = useState(false);
  const status = STATUS_INFO[periodo.status];
  const podeRegistrar = Boolean(colaborador) && periodo.status !== 'aquisitivo' && periodo.saldoDias > 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">
            Periodo {periodo.indice + 1}
          </p>
          <p className="text-xs text-faint">
            {formatDateBR(periodo.aquisitivoInicio)} a {formatDateBR(periodo.aquisitivoFim)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${status.cor}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-faint">Direito</p>
          <p className="text-sm font-medium text-foreground">{periodo.diasDireito}d</p>
        </div>
        <div>
          <p className="text-[10px] text-faint">Gozados</p>
          <p className="text-sm text-muted">{periodo.diasGozados}d</p>
        </div>
        <div>
          <p className="text-[10px] text-faint">Saldo</p>
          <p className="text-sm font-medium text-positive">{periodo.saldoDias}d</p>
        </div>
      </div>

      {periodo.status !== 'aquisitivo' && (
        <p className="mt-2 text-xs text-faint">
          Prazo para conceder: ate {formatDateBR(periodo.concessivoFim)}
        </p>
      )}

      {podeRegistrar && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={() => setRegistrando(true)}
            className="text-sm font-medium text-accent hover:text-accent-ink"
          >
            Registrar ferias
          </button>
        </div>
      )}

      {registrando && colaborador && (
        <ModalRegistrarGozo
          periodo={periodo}
          colaborador={colaborador}
          onClose={() => setRegistrando(false)}
        />
      )}
    </div>
  );
}

function ModalRegistrarGozo({
  periodo,
  colaborador,
  onClose,
}: {
  periodo: PeriodoFerias;
  colaborador: { id: string; nome: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const res = await fetch('/api/ferias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        colaboradorId: colaborador.id,
        periodoIndice: periodo.indice,
        inicio,
        fim,
        observacao,
      }),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      const mensagem = data.error || 'Erro ao registrar ferias';
      setErro(mensagem);
      showToast(mensagem, 'error');
      return;
    }

    showToast('Ferias registradas com sucesso');
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground">Registrar Ferias</h3>
          <button onClick={onClose} className="text-faint hover:text-muted">Fechar</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Colaborador</label>
            <p className="text-foreground font-medium">{colaborador.nome}</p>
          </div>
          <p className="text-xs text-faint">
            Periodo {periodo.indice + 1} - saldo disponivel: {periodo.saldoDias} dia(s)
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Inicio</label>
              <input required type="date" value={inicio} onChange={(e) => setInicio(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Fim</label>
              <input required type="date" value={fim} onChange={(e) => setFim(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">Observacao</label>
            <textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
          </div>

          {erro && <p className="text-sm text-critical">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted hover:bg-surface-hover rounded-lg transition">
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
