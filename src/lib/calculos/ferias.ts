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
//   Como o app ainda nao rastreia faltas injustificadas, o padrao e 0 faltas
//   (30 dias de direito) ate essa informacao existir.

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
