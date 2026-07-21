// src/lib/calculos/horas.ts

/** Converte "HH:mm" para horas decimais (ex: "08:30" -> 8.5) */
export function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

/** Diferenca em horas decimais entre dois horarios "HH:mm" */
export function calcularDiferencaHoras(entrada: string, saida: string): number {
  return parseTime(saida) - parseTime(entrada);
}

/** Formata horas decimais como "Xh YYm" */
export function horasParaTexto(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h}h ${m < 10 ? '0' : ''}${m}m`;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// adicionar ao final de src/lib/calculos/horas.ts

/** Formata um Date para "HH:mm" no fuso de Brasilia, independente do fuso do servidor */
export function formatTimeBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

/** Formata um Date para "YYYY-MM-DD" no fuso de Brasilia (evita erro de "dia errado" perto da meia-noite) */
export function formatDateISOBR(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}