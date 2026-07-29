// src/app/apple-icon.tsx
import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default async function AppleIcon() {
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
