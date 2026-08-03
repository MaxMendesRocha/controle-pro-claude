'use client';

// src/components/registros/ModalCompletarIntervalo.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { RegistroPonto } from '@/types';

export function ModalCompletarIntervalo({
  registro,
  onClose,
}: {
  registro: RegistroPonto;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saidaIntervalo, setSaidaIntervalo] = useState('');
  const [voltaIntervalo, setVoltaIntervalo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);

    const res = await fetch('/api/ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'completar-intervalo',
        data: registro.data,
        saidaIntervalo,
        voltaIntervalo,
        motivo,
      }),
    });

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      const mensagem = data.error || 'Erro ao completar intervalo';
      setErro(mensagem);
      showToast(mensagem, 'error');
      return;
    }

    showToast('Batidas de intervalo registradas');
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-foreground">Completar Intervalo</h3>
          <button onClick={onClose} className="text-faint hover:text-muted">Fechar</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Data</label>
            <p className="text-foreground">{registro.data.split('-').reverse().join('/')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Saida Intervalo</label>
              <input required type="time" value={saidaIntervalo} onChange={(e) => setSaidaIntervalo(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Volta Intervalo</label>
              <input required type="time" value={voltaIntervalo} onChange={(e) => setVoltaIntervalo(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-surface-2 text-foreground rounded-lg outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">Justificativa *</label>
            <textarea required value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2}
              placeholder="Ex: Esqueci de bater o intervalo"
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
