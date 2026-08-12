// src/lib/calculos/faltas.ts
//
// Deteccao de faltas injustificadas, reaproveitada tanto no calculo de folha
// (holerite.ts - desconto no periodo de pagamento) quanto no calculo de dias
// de direito a ferias (ferias.ts - reducao pela tabela do Art. 130).
//
// Um dia da escala normal do colaborador conta como falta se nao ha registro
// de ponto completo nele E o colaborador nao estava de ferias nesse dia
// (gozo registrado cobrindo a data). Dias fora da escala (ver isDiaExtra) nunca
// contam como falta, ja que nao ha expectativa de trabalho neles.

import { isDiaExtra } from './diasTrabalho';
import type { DiaDaSemana } from '@/types';

function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Lista as datas (YYYY-MM-DD) de trabalho normal esperadas (segundo a escala do colaborador) entre inicio e fim, inclusive */
export function listarDiasUteisEsperados(inicio: string, fim: string, diasTrabalho: DiaDaSemana[]): string[] {
  const datas: string[] = [];
  const cursor = new Date(inicio + 'T12:00:00');
  const fimDate = new Date(fim + 'T12:00:00');

  while (cursor <= fimDate) {
    const dataStr = formatarData(cursor);
    if (!isDiaExtra(dataStr, diasTrabalho)) datas.push(dataStr);
    cursor.setDate(cursor.getDate() + 1);
  }

  return datas;
}

export interface ResultadoFaltas {
  faltas: number;
  datasFaltantes: string[];
}

/**
 * Conta as faltas injustificadas entre inicio e fim: dias da escala normal
 * sem registro de ponto completo (`datasTrabalhadas`) e sem gozo de ferias
 * cobrindo a data (`datasEmFerias`).
 */
export function calcularFaltas(
  inicio: string,
  fim: string,
  diasTrabalho: DiaDaSemana[],
  datasTrabalhadas: Set<string>,
  datasEmFerias: Set<string> = new Set()
): ResultadoFaltas {
  const diasUteisEsperados = listarDiasUteisEsperados(inicio, fim, diasTrabalho);
  const datasFaltantes = diasUteisEsperados.filter(
    (d) => !datasTrabalhadas.has(d) && !datasEmFerias.has(d)
  );
  return { faltas: datasFaltantes.length, datasFaltantes };
}

/** Expande os gozos de ferias (intervalos inicio/fim) num Set de datas individuais cobertas */
export function datasCobertasPorGozos(gozos: { inicio: string; fim: string }[]): Set<string> {
  const datas = new Set<string>();
  for (const g of gozos) {
    const cursor = new Date(g.inicio + 'T12:00:00');
    const fimDate = new Date(g.fim + 'T12:00:00');
    while (cursor <= fimDate) {
      datas.add(formatarData(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return datas;
}
