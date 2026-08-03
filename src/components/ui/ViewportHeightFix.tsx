'use client';

// src/components/ui/ViewportHeightFix.tsx
//
// dvh via CSS deveria bastar, mas alguns navegadores Android (principalmente
// logo apos o carregamento, antes da UI do navegador "assentar") relatam um
// valor de altura maior do que a area realmente visivel por um instante,
// empurrando o conteudo do final da tela (o menu inferior) pra tras da barra
// de gestos do sistema. Medir window.innerHeight via JS e mais confiavel
// nesses casos, entao usamos isso como reforco por cima do dvh (que continua
// sendo o fallback via CSS, caso o JS ainda nao tenha rodado).
import { useEffect } from 'react';

export function ViewportHeightFix() {
  useEffect(() => {
    function set() {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    }

    set();
    window.addEventListener('resize', set);
    window.addEventListener('orientationchange', set);

    return () => {
      window.removeEventListener('resize', set);
      window.removeEventListener('orientationchange', set);
    };
  }, []);

  return null;
}
