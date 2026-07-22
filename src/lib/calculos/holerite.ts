// src/lib/calculos/holerite.ts
//
// AVISO IMPORTANTE: este calculo e uma aproximacao razoavel das regras
// gerais da CLT (hora extra 50%/100%, INSS progressivo, FGTS 8%), mas
// nao cobre todos os casos especiais da legislacao trabalhista brasileira
// (ex: acordos de compensacao de jornada, convencoes coletivas com
// percentuais diferentes, decimo terceiro, ferias, adicional noturno,
// insalubridade/periculosidade). Antes de usar em folha de pagamento
// real, revise com um contador ou especialista em Departamento Pessoal.
//
// O periodo da folha (data inicio/fim) e calculado externamente por
// calcularPeriodo() e passado pronto para esta funcao - isso permite
// suportar tanto mes calendario quanto fechamento customizado (ex: 26 a 25)
// sem duplicar essa logica aqui.
//
// Regra de dias uteis adotada: cada colaborador tem seu proprio conjunto
// de "dias de trabalho normais" (campo colaborador.diasTrabalho, ex: seg-sex).
// Qualquer dia que nao esteja nesse conjunto, OU que seja feriado nacional
// fixo, e tratado como "dia extra" - hora trabalhada nele conta inteira
// como hora extra com o percentual maior (heDomingoFeriadoPercent), e a
// ausencia nele NAO conta como falta no calculo de desconto.

import { classificarHorasRegistro } from './registro';
import { isDiaExtra, DIAS_TRABALHO_PADRAO } from './diasTrabalho';
import type { PeriodoFolha } from './periodo';
import type { Colaborador, RegistroPonto, RegrasCalculo, Holerite, DiaDaSemana } from '@/types';

const DIVISOR_HORA_MENSAL = 220; // padrao CLT para jornada de 44h semanais

/** Tabela INSS progressiva (valores de referencia - conferir atualizacao anual) */
function calcularINSS(baseCalculo: number): number {
  if (baseCalculo <= 1518.0) return baseCalculo * 0.075;
  if (baseCalculo <= 2793.88) return baseCalculo * 0.09;
  if (baseCalculo <= 4190.83) return baseCalculo * 0.12;
  if (baseCalculo <= 8157.97) return baseCalculo * 0.14;
  return 1042.22; // teto do INSS
}

function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Conta quantos dias de trabalho normais (segundo a escala do colaborador) existem entre inicio e fim, inclusive */
function contarDiasUteisEsperados(inicio: string, fim: string, diasTrabalho: DiaDaSemana[]): number {
  let count = 0;
  const cursor = new Date(inicio + 'T12:00:00');
  const fimDate = new Date(fim + 'T12:00:00');

  while (cursor <= fimDate) {
    const dataStr = formatarData(cursor);
    if (!isDiaExtra(dataStr, diasTrabalho)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

export interface ResultadoCalculoHolerite {
  holerite: Omit<Holerite, 'id'>;
  avisos: string[];
}

/**
 * Calcula o holerite de um colaborador para um periodo de folha especifico,
 * a partir dos registros de ponto ja filtrados para esse colaborador+periodo
 * e das regras de calculo vigentes da empresa.
 *
 * Funcao pura: nao acessa banco de dados, nao tem efeitos colaterais.
 * "hoje" e usado apenas para saber ate que dia contar "dias uteis esperados"
 * quando o periodo ainda esta em andamento (nao terminou ainda).
 */
export function calcularHolerite(
  colaborador: Colaborador,
  registrosDoPeriodo: RegistroPonto[],
  regras: RegrasCalculo,
  mesReferencia: string,
  periodo: PeriodoFolha,
  hoje: Date = new Date()
): ResultadoCalculoHolerite {
  const avisos: string[] = [];

  const diasTrabalho: DiaDaSemana[] = colaborador.diasTrabalho?.length
    ? colaborador.diasTrabalho
    : DIAS_TRABALHO_PADRAO;

  const registrosCompletos = registrosDoPeriodo.filter((r) => r.entrada && r.saida);

  let totalHorasNormais = 0;
  let totalHorasExtras = 0; // dias normais da escala, acima da carga diaria (50%)
  let totalHorasExtrasDomingoFeriado = 0; // qualquer hora trabalhada fora da escala normal (100%)

  for (const registro of registrosCompletos) {
    const classificacao = classificarHorasRegistro(registro.data, registro.entrada!, registro.saida!, colaborador);

    if (classificacao.totalHoras <= 0) {
      avisos.push(`Registro de ${registro.data} tem duracao invalida (saida antes ou igual a entrada) - ignorado no calculo`);
      continue;
    }

    if (classificacao.ehDiaExtra) {
      totalHorasExtrasDomingoFeriado += classificacao.horasExtras;
    } else {
      totalHorasNormais += classificacao.horasNormais;
      totalHorasExtras += classificacao.horasExtras;
    }
  }

  const totalHE = totalHorasExtras + totalHorasExtrasDomingoFeriado;
  if (totalHE > regras.limiteHEMensal) {
    avisos.push(
      `Total de horas extras (${totalHE.toFixed(1)}h) excede o limite mensal configurado (${regras.limiteHEMensal}h) - revise antes de gerar`
    );
  }

  const diasTrabalhados = registrosCompletos.length;

  const hojeStr = formatarData(hoje);
  const ateData = hojeStr < periodo.fim ? hojeStr : periodo.fim;
  const diasUteisEsperados = contarDiasUteisEsperados(periodo.inicio, ateData, diasTrabalho);

  const diasNormaisTrabalhados = registrosCompletos.filter((r) => !isDiaExtra(r.data, diasTrabalho)).length;
  const faltas = Math.max(0, diasUteisEsperados - diasNormaisTrabalhados);

  const valorHora = colaborador.salarioBase / DIVISOR_HORA_MENSAL;

  const valorHorasExtras50 = totalHorasExtras * valorHora * (1 + regras.heUtilPercent / 100);
  const valorHorasExtras100 = totalHorasExtrasDomingoFeriado * valorHora * (1 + regras.heDomingoFeriadoPercent / 100);

  const descontoFaltas = faltas * colaborador.cargaHoraria * valorHora * (regras.descontoFaltaPercent / 100);

  const remuneracaoBruta =
    colaborador.salarioBase + valorHorasExtras50 + valorHorasExtras100 - descontoFaltas;

  const inss = calcularINSS(remuneracaoBruta);
  const fgts = remuneracaoBruta * 0.08; // informativo - pago pelo empregador, nao deduzido do liquido

  const liquido = remuneracaoBruta - inss;

  if (faltas > 0) {
    avisos.push(`${faltas} falta(s) nao justificada(s) detectada(s) neste periodo (dias da escala normal)`);
  }

  const holerite: Omit<Holerite, 'id'> = {
    empresaId: colaborador.empresaId,
    colaboradorId: colaborador.uid,
    mes: mesReferencia,
    periodoInicio: periodo.inicio,
    periodoFim: periodo.fim,
    diasTrabalhados,
    totalHorasNormais,
    totalHorasExtras,
    totalHorasExtrasDomingoFeriado,
    salarioBase: colaborador.salarioBase,
    valorHorasExtras50,
    valorHorasExtras100,
    valorHorasExtras: valorHorasExtras50 + valorHorasExtras100,
    descontoFaltas,
    inss,
    fgts,
    liquido,
    geradoEm: new Date().toISOString(),
  };

  return { holerite, avisos };
}