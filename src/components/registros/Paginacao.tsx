// src/components/registros/Paginacao.tsx
import Link from 'next/link';

export function Paginacao({
  paginaAtual,
  totalPaginas,
  criarHref,
}: {
  paginaAtual: number;
  totalPaginas: number;
  criarHref: (pagina: number) => string;
}) {
  if (totalPaginas <= 1) return null;

  const noInicio = paginaAtual <= 1;
  const noFim = paginaAtual >= totalPaginas;

  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <Link
        href={criarHref(Math.max(1, paginaAtual - 1))}
        aria-disabled={noInicio}
        tabIndex={noInicio ? -1 : undefined}
        className={`rounded-lg border border-border px-4 py-2 text-sm font-medium transition ${
          noInicio ? 'pointer-events-none text-faint opacity-50' : 'text-foreground hover:bg-surface-hover'
        }`}
      >
        Anterior
      </Link>
      <span className="text-xs text-faint">
        Pagina {paginaAtual} de {totalPaginas}
      </span>
      <Link
        href={criarHref(Math.min(totalPaginas, paginaAtual + 1))}
        aria-disabled={noFim}
        tabIndex={noFim ? -1 : undefined}
        className={`rounded-lg border border-border px-4 py-2 text-sm font-medium transition ${
          noFim ? 'pointer-events-none text-faint opacity-50' : 'text-foreground hover:bg-surface-hover'
        }`}
      >
        Proxima
      </Link>
    </div>
  );
}
