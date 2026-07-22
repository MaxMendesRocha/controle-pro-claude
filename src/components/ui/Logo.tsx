// src/components/ui/Logo.tsx

export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="7" />
      <rect x="46.5" y="10" width="7" height="9" rx="3.5" fill="#2563eb" />
      <rect x="46.5" y="81" width="7" height="9" rx="3.5" fill="#2563eb" />
      <rect x="10" y="46.5" width="9" height="7" rx="3.5" fill="#2563eb" />
      <rect x="81" y="46.5" width="9" height="7" rx="3.5" fill="#2563eb" />
      <path
        d="M 32 52 L 44 65 L 72 34"
        fill="none"
        stroke="#059669"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoFull({ width = 200 }: { width?: number }) {
  const height = (width / 280) * 64;
  return (
    <svg width={width} height={height} viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(0, 2) scale(0.6)">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="7" />
        <rect x="46.5" y="10" width="7" height="9" rx="3.5" fill="#2563eb" />
        <rect x="46.5" y="81" width="7" height="9" rx="3.5" fill="#2563eb" />
        <rect x="10" y="46.5" width="9" height="7" rx="3.5" fill="#2563eb" />
        <rect x="81" y="46.5" width="9" height="7" rx="3.5" fill="#2563eb" />
        <path
          d="M 32 52 L 44 65 L 72 34"
          fill="none"
          stroke="#059669"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text
        x="70"
        y="42"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="30"
        fontWeight="800"
      >
        <tspan fill="#1e3a8a">Ponto</tspan>
        <tspan fill="#059669">Pro</tspan>
      </text>
    </svg>
  );
}