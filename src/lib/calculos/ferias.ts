// src/lib/calculos/ferias.ts
//
// Fase 1: calculo puro dos periodos de ferias (CLT Art. 129-134), a partir
// da data de admissao do colaborador.
//
// - Periodo aquisitivo: os 12 meses corridos a partir da admissao (ou do fim
//   do periodo aquisitivo anterior). Ao completar 12 meses o colaborador
//   adquire o direito as ferias correspondentes a esse periodo.
// - Periodo concessivo: os 12 meses seguintes ao termino do periodo
//   aquisitivo - prazo em que o empregador deve conceder as ferias (Art. 134).
//   Se esse prazo passa sem a concessao, o periodo fica "vencido" (o que da
//   direito ao pagamento em dobro - o calculo desse efeito fica para uma fase
//   futura).
// - Dias de direito: 30 dias corridos por periodo aquisitivo, reduzidos
//   conforme o numero de faltas injustificadas nesse periodo (Art. 130).
//   `calcularFaltasPorPeriodo` deriva essas faltas a partir dos registros de
//   ponto e dos gozos de ferias ja registrados (ver faltas.ts).

import { calcularFaltas, datasCobertasPorGozos } from './faltas';
import { isDiaExtra } from './diasTrabalho';
import type { DiaDaSemana } from '@/types';

export type StatusPeriodoFerias = 'aquisitivo' | 'concessivo' | 'vencido';

export interface PeriodoFerias {
  /** 0 = primeiro periodo aquisitivo apos a admissao, 1 = segundo, ... */
  indice: number;
  aquisitivoInicio: string; // YYYY-MM-DD
  aquisitivoFim: string; // YYYY-MM-DD
  concessivoInicio: string; // YYYY-MM-DD
  concessivoFim: string; // YYYY-MM-DD
  diasDireito: number; // 0-30, conforme faltas injustificadas (Art. 130)
  diasGozados: number;
  saldoDias: number;
  status: StatusPeriodoFerias;
}

function parseISO(dataISO: string): { ano: number; mes: number; dia: number } {
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  return { ano, mes, dia };
}

function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function adicionarMeses(dataISO: string, meses: number): string {
  const { ano, mes, dia } = parseISO(dataISO);
  return formatarData(new Date(ano, mes - 1 + meses, dia));
}

function adicionarDias(dataISO: string, dias: number): string {
  const { ano, mes, dia } = parseISO(dataISO);
  return formatarData(new Date(ano, mes - 1, dia + dias));
}

/** Dias de ferias a que o colaborador tem direito no periodo, conforme faltas injustificadas (CLT Art. 130) */
export function diasDireitoPorFaltas(faltasInjustificadas: number): number {
  if (faltasInjustificadas <= 5) return 30;
  if (faltasInjustificadas <= 14) return 24;
  if (faltasInjustificadas <= 23) return 18;
  if (faltasInjustificadas <= 32) return 12;
  return 0;
}

export interface OpcoesCalculoFerias {
  /** faltas injustificadas no periodo aquisitivo, indexadas por `indice` do periodo */
  faltasPorPeriodo?: Record<number, number>;
  /** dias de ferias ja gozados/agendados nesse periodo aquisitivo, indexados por `indice` */
  diasGozadosPorPeriodo?: Record<number, number>;
}

/**
 * Retorna todos os periodos aquisitivos do colaborador desde a admissao ate
 * hoje (inclusive o periodo aquisitivo em andamento).
 */
export function calcularPeriodosFerias(
  admissao: string,
  hoje: string = formatarData(new Date()),
  opcoes: OpcoesCalculoFerias = {}
): PeriodoFerias[] {
  const { faltasPorPeriodo = {}, diasGozadosPorPeriodo = {} } = opcoes;
  const periodos: PeriodoFerias[] = [];

  for (let indice = 0; ; indice++) {
    const aquisitivoInicio = adicionarMeses(admissao, 12 * indice);
    if (aquisitivoInicio > hoje) break;

    const aquisitivoFim = adicionarDias(adicionarMeses(admissao, 12 * (indice + 1)), -1);
    const concessivoInicio = adicionarDias(aquisitivoFim, 1);
    const concessivoFim = adicionarDias(adicionarMeses(admissao, 12 * (indice + 2)), -1);

    let status: StatusPeriodoFerias;
    if (hoje <= aquisitivoFim) {
      status = 'aquisitivo';
    } else if (hoje <= concessivoFim) {
      status = 'concessivo';
    } else {
      status = 'vencido';
    }

    const diasDireito = diasDireitoPorFaltas(faltasPorPeriodo[indice] ?? 0);
    const diasGozados = diasGozadosPorPeriodo[indice] ?? 0;
    const saldoDias = Math.max(0, diasDireito - diasGozados);

    periodos.push({
      indice,
      aquisitivoInicio,
      aquisitivoFim,
      concessivoInicio,
      concessivoFim,
      diasDireito,
      diasGozados,
      saldoDias,
      status,
    });
  }

  return periodos;
}

/**
 * Conta as faltas injustificadas dentro de cada periodo aquisitivo (ate hoje,
 * para o periodo em andamento), para alimentar `faltasPorPeriodo` em
 * calcularPeriodosFerias. Chame calcularPeriodosFerias uma primeira vez (sem
 * faltasPorPeriodo) so para obter os limites de data de cada periodo, depois
 * use o resultado aqui e chame de novo com o resultado desta funcao.
 */
export function calcularFaltasPorPeriodo(
  periodos: Pick<PeriodoFerias, 'indice' | 'aquisitivoInicio' | 'aquisitivoFim'>[],
  hoje: string,
  diasTrabalho: DiaDaSemana[],
  datasTrabalhadas: Set<string>,
  datasEmFerias: Set<string> = new Set()
): Record<number, number> {
  const faltasPorPeriodo: Record<number, number> = {};

  for (const p of periodos) {
    const ate = hoje < p.aquisitivoFim ? hoje : p.aquisitivoFim;
    if (ate < p.aquisitivoInicio) continue;

    const { faltas } = calcularFaltas(p.aquisitivoInicio, ate, diasTrabalho, datasTrabalhadas, datasEmFerias);
    faltasPorPeriodo[p.indice] = faltas;
  }

  return faltasPorPeriodo;
}

/**
 * Combina calcularPeriodosFerias + calcularFaltasPorPeriodo num unico
 * calculo pronto pra uso, a partir dos registros de ponto e gozos de ferias
 * brutos do colaborador. Funcao pura - quem chama e responsavel por buscar
 * esses dados no banco.
 */
export function calcularPeriodosFeriasCompleto(
  colaborador: { admissao: string; diasTrabalho: DiaDaSemana[] },
  hoje: string,
  registros: { data: string; entrada: string | null; saida: string | null }[],
  gozos: { periodoIndice: number; inicio: string; fim: string; dias: number }[]
): PeriodoFerias[] {
  const diasGozadosPorPeriodo: Record<number, number> = {};
  for (const g of gozos) {
    diasGozadosPorPeriodo[g.periodoIndice] = (diasGozadosPorPeriodo[g.periodoIndice] ?? 0) + g.dias;
  }

  const periodosBase = calcularPeriodosFerias(colaborador.admissao, hoje, { diasGozadosPorPeriodo });

  const datasTrabalhadas = new Set(
    registros
      .filter((r) => r.entrada && r.saida && !isDiaExtra(r.data, colaborador.diasTrabalho))
      .map((r) => r.data)
  );
  const datasEmFerias = datasCobertasPorGozos(gozos);
  const faltasPorPeriodo = calcularFaltasPorPeriodo(periodosBase, hoje, colaborador.diasTrabalho, datasTrabalhadas, datasEmFerias);

  return calcularPeriodosFerias(colaborador.admissao, hoje, { diasGozadosPorPeriodo, faltasPorPeriodo });
}
