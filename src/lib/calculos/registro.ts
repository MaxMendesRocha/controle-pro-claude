// src/lib/calculos/registro.ts
import { calcularDiferencaHoras } from './horas';
import { isDiaExtra } from './diasTrabalho';
import type { Colaborador } from '@/types';

export interface ClassificacaoHoras {
  totalHoras: number;
  horasNormais: number;
  horasExtras: number;
  ehDiaExtra: boolean; // true = sabado/domingo/feriado (fora da escala do colaborador)
}

/**
 * Classifica as horas de um registro de ponto (entrada/saida de um dia) em
 * normais vs extras, respeitando a escala de trabalho do colaborador e o
 * calendario de feriados. Usar esta funcao em qualquer tela que precise
 * mostrar "horas extras" de um registro, para manter consistencia com o
 * motor de calculo de holerite.
 */
export function classificarHorasRegistro(
  data: string,
  entrada: string,
  saida: string,
  colaborador: Pick<Colaborador, 'cargaHoraria' | 'diasTrabalho'>
): ClassificacaoHoras {
  const totalHoras = calcularDiferencaHoras(entrada, saida);
  const ehDiaExtra = isDiaExtra(data, colaborador.diasTrabalho);

  if (ehDiaExtra) {
    // fora da escala normal (sabado/domingo/feriado): tudo conta como extra
    return { totalHoras, horasNormais: 0, horasExtras: totalHoras, ehDiaExtra: true };
  }

  const horasNormais = Math.min(totalHoras, colaborador.cargaHoraria);
  const horasExtras = Math.max(0, totalHoras - horasNormais);
  return { totalHoras, horasNormais, horasExtras, ehDiaExtra: false };
}