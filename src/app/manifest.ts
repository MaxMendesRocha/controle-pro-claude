// src/app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PontoPro - Gerenciamento Inteligente',
    short_name: 'PontoPro',
    description: 'Sistema de controle de ponto e folha de pagamento',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0e1b',
    theme_color: '#0a0e1b',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
