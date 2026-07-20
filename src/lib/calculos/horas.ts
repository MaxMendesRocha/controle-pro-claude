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