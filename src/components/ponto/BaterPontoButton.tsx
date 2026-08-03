'use client';

// src/components/ponto/BaterPontoButton.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

type TipoBatida = 'entrada' | 'saida' | 'saida-intervalo' | 'volta-intervalo';

const CONFIG: Record<TipoBatida, { texto: string; cor: string; toast: string }> = {
  entrada: { texto: 'Registrar Entrada', cor: 'bg-positive hover:bg-positive/90', toast: 'Entrada registrada' },
  'saida-intervalo': {
    texto: 'Sair para o Intervalo',
    cor: 'bg-accent hover:bg-accent/90',
    toast: 'Saida para o intervalo registrada',
  },
  'volta-intervalo': {
    texto: 'Voltar do Intervalo',
    cor: 'bg-accent hover:bg-accent/90',
    toast: 'Volta do intervalo registrada',
  },
  saida: { texto: 'Registrar Saida', cor: 'bg-critical hover:bg-critical/90', toast: 'Saida registrada' },
};

export function BaterPontoButton({
  tipo,
  permitirPularIntervalo = false,
}: {
  tipo: TipoBatida;
  /** so relevante quando tipo === 'saida': mostra o checkbox pra declarar que o intervalo nao foi feito hoje */
  permitirPularIntervalo?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [intervaloNaoUsufruido, setIntervaloNaoUsufruido] = useState(false);

  const mostrarCheckbox = tipo === 'saida' && permitirPularIntervalo;

  async function handleClick() {
    setErro(null);
    setCarregando(true);

    const res = await fetch('/api/ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo,
        intervaloNaoUsufruido: mostrarCheckbox ? intervaloNaoUsufruido : undefined,
      }),
    });

    setCarregando(false);

    if (!res.ok) {
      const data = await res.json();
      const mensagem = data.error || 'Erro ao registrar ponto';
      setErro(mensagem);
      showToast(mensagem, 'error');
      return;
    }

    showToast(CONFIG[tipo].toast);
    router.refresh();
  }

  return (
    <div>
      {mostrarCheckbox && (
        <label className="flex items-center justify-center gap-2 text-sm text-muted mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={intervaloNaoUsufruido}
            onChange={(e) => setIntervaloNaoUsufruido(e.target.checked)}
            className="rounded border-border"
          />
          Nao fiz o intervalo hoje
        </label>
      )}
      <button
        onClick={handleClick}
        disabled={carregando}
        className={`px-8 py-3 rounded-xl font-semibold text-lg transition shadow-lg text-white disabled:opacity-50 ${CONFIG[tipo].cor}`}
      >
        {carregando ? 'Registrando...' : CONFIG[tipo].texto}
      </button>
      {erro && <p className="text-sm text-critical mt-2">{erro}</p>}
    </div>
  );
}
