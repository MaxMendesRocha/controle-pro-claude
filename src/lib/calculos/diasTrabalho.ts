// src/lib/calculos/diasTrabalho.ts
import { isDomingoOuFeriado } from './feriados';
import type { DiaDaSemana } from '@/types';

/** Escala padrao usada como fallback para colaboradores cadastrados antes deste campo existir */
export const DIAS_TRABALHO_PADRAO: DiaDaSemana[] = [1, 2, 3, 4, 5];

/**
 * Um dia e "extra" para um colaborador se for feriado nacional fixo (ou domingo),
 * OU se o dia da semana nao estiver na escala normal de trabalho dele.
 * Trabalho em dia extra e pago com o percentual maior de hora extra.
 */
export function isDiaExtra(dataISO: string, diasTrabalho: DiaDaSemana[] | undefined | null): boolean {
  const escala = diasTrabalho?.length ? diasTrabalho : DIAS_TRABALHO_PADRAO;
  const diaSemana = new Date(dataISO + 'T12:00:00').getDay() as DiaDaSemana;
  if (isDomingoOuFeriado(dataISO)) return true;
  return !escala.includes(diaSemana);
}