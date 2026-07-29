'use client';

// src/components/ui/IdleLogoutWatcher.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { performLogout } from '@/lib/auth/logout';

const IDLE_LIMIT_MS = 30 * 60 * 1000; // desloga apos 30 min sem interacao
const AVISO_SEGUNDOS = 60; // mostra aviso 60s antes de deslogar
const THROTTLE_MS = 5000; // nao reseta o timer a cada pixel de mousemove

const EVENTOS_ATIVIDADE = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

export function IdleLogoutWatcher() {
  const router = useRouter();
  const [avisoVisivel, setAvisoVisivel] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(AVISO_SEGUNDOS);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimoResetRef = useRef(0);

  const limparTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const deslogarPorInatividade = useCallback(async () => {
    limparTimers();
    await performLogout();
    router.push('/login');
    router.refresh();
  }, [limparTimers, router]);

  const iniciarAviso = useCallback(() => {
    setAvisoVisivel(true);
    setSegundosRestantes(AVISO_SEGUNDOS);
    countdownRef.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          deslogarPorInatividade();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [deslogarPorInatividade]);

  const resetarTimer = useCallback(
    (forcar = false) => {
      const agora = Date.now();
      if (!forcar && agora - ultimoResetRef.current < THROTTLE_MS) return;
      ultimoResetRef.current = agora;

      limparTimers();
      setAvisoVisivel(false);
      idleTimerRef.current = setTimeout(iniciarAviso, IDLE_LIMIT_MS - AVISO_SEGUNDOS * 1000);
    },
    [limparTimers, iniciarAviso]
  );

  const handleAtividade = useCallback(() => {
    resetarTimer();
  }, [resetarTimer]);

  useEffect(() => {
    resetarTimer(true);

    EVENTOS_ATIVIDADE.forEach((evento) => window.addEventListener(evento, handleAtividade, { passive: true }));

    return () => {
      limparTimers();
      EVENTOS_ATIVIDADE.forEach((evento) => window.removeEventListener(evento, handleAtividade));
    };
  }, [handleAtividade, limparTimers, resetarTimer]);

  if (!avisoVisivel) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-2xl">
        <p className="text-lg font-bold text-foreground">Voce ainda esta ai?</p>
        <p className="mt-2 text-sm text-muted">
          Por seguranca, sua sessao sera encerrada em{' '}
          <span className="font-semibold text-warning">{segundosRestantes}s</span> por inatividade.
        </p>
        <button
          onClick={() => resetarTimer(true)}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          Continuar conectado
        </button>
        <button
          onClick={deslogarPorInatividade}
          className="mt-2 w-full rounded-lg px-4 py-2 text-sm font-medium text-faint transition hover:text-muted"
        >
          Sair agora
        </button>
      </div>
    </div>
  );
}
