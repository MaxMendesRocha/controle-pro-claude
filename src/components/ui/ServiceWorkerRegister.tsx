'use client';

// src/components/ui/ServiceWorkerRegister.tsx
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Instalacao como PWA e um extra, nao critico - falha aqui nao deve
      // atrapalhar o uso normal do app.
    });
  }, []);

  return null;
}
