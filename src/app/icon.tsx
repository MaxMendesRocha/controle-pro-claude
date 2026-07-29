// src/app/icon.tsx
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Gera um icone QUADRADO (o PNG de origem e 566x551 - nao quadrado, e alguns
// navegadores rejeitam silenciosamente icones nao-quadrados no manifest,
// caindo para um atalho generico em vez do app instalavel de verdade).
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default async function Icon() {
  const imageData = await readFile(join(process.cwd(), 'public', 'pontopro-logo-icone.png'));
  const src = `data:image/png;base64,${imageData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1b',
        }}
      >
        <img src={src} width={420} height={409} alt="" />
      </div>
    ),
    { ...size }
  );
}
