// src/lib/calculos/registro.ts
import { calcularDiferencaHoras } from './horas';
import { isDiaExtra } from './diasTrabalho';
import { calcularIntervaloMinutos } from './intervalo';
import type { Colaborador } from '@/types';

export interface ClassificacaoHoras {
  totalHorasBruto: number; // diferenca crua entre entrada e saida, sem descontar intervalo
  intervaloMinutos: number; // minutos de intervalo descontados (0 se nao usufruido ou jornada <=4h)
  totalHoras: number; // horas efetivamente trabalhadas (bruto - intervalo)
  horasNormais: number;
  horasExtras: number;
  ehDiaExtra: boolean; // true = sabado/domingo/feriado (fora da escala do colaborador)
}

/**
 * Classifica as horas de um registro de ponto (entrada/saida de um dia) em
 * normais vs extras, aplicando primeiro o desconto automatico de intervalo
 * intrajornada (Art. 71 CLT) e depois respeitando a escala de trabalho do
 * colaborador e o calendario de feriados. Usar esta funcao em qualquer tela
 * que precise mostrar "horas trabalhadas"/"horas extras" de um registro,
 * para manter consistencia com o motor de calculo de holerite.
 */
export function classificarHorasRegistro(
  data: string,
  entrada: string,
  saida: string,
  colaborador: Pick<Colaborador, 'cargaHoraria' | 'diasTrabalho'>,
  intervaloNaoUsufruido: boolean = false
): ClassificacaoHoras {
  const totalHorasBruto = calcularDiferencaHoras(entrada, saida);
  const intervaloMinutos = intervaloNaoUsufruido ? 0 : calcularIntervaloMinutos(totalHorasBruto);
  const totalHoras = Math.max(0, totalHorasBruto - intervaloMinutos / 60);

  const ehDiaExtra = isDiaExtra(data, colaborador.diasTrabalho);

  if (ehDiaExtra) {
    // fora da escala normal (sabado/domingo/feriado): tudo conta como extra
    return { totalHorasBruto, intervaloMinutos, totalHoras, horasNormais: 0, horasExtras: totalHoras, ehDiaExtra: true };
  }

  const horasNormais = Math.min(totalHoras, colaborador.cargaHoraria);
  const horasExtras = Math.max(0, totalHoras - horasNormais);
  return { totalHorasBruto, intervaloMinutos, totalHoras, horasNormais, horasExtras, ehDiaExtra: false };
}