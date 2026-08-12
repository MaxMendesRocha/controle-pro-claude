// src/types/index.ts
export type Role = 'gestor' | 'colaborador';

/** 0 = domingo, 1 = segunda, 2 = terca, 3 = quarta, 4 = quinta, 5 = sexta, 6 = sabado */
export type DiaDaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Colaborador {
  id: string;
  empresaId: string;
  uid: string; // Firebase Auth UID
  nome: string;
  cpf: string;
  email: string;
  cargo: string;
  salarioBase: number;
  cargaHoraria: number; // horas/dia
  /** Dias da semana considerados jornada normal para este colaborador (ex: [1,2,3,4,5] = seg a sex) */
  diasTrabalho: DiaDaSemana[];
  admissao: string; // ISO date (YYYY-MM-DD)
  banco?: string;
  ativo: boolean;
  role: Role;
  criadoEm: string; // ISO timestamp
  /** true = colaborador bate saida/volta do intervalo manualmente; false/ausente = desconto automatico (padrao) */
  intervaloManual?: boolean;
  /** minutos minimos de intervalo exigidos, configurado pelo gestor - so relevante quando intervaloManual = true */
  duracaoIntervaloMinutos?: number;
}

export interface RegistroPonto {
  id: string;
  empresaId: string;
  colaboradorId: string;
  data: string; // YYYY-MM-DD
  entrada: string | null; // HH:mm
  saida: string | null; // HH:mm
  tipo: 'automatico' | 'manual';
  motivo?: string | null;
  editadoPor?: string | null; // uid do gestor, se editado
  editadoEm?: string | null; // ISO timestamp
  criadoEm: string; // ISO timestamp - server timestamp
  /** true = o intervalo intrajornada nao foi de fato usufruido neste dia; nao descontar automaticamente */
  intervaloNaoUsufruido?: boolean;
  /** batidas manuais do intervalo (HH:mm) - so usadas quando o colaborador tem intervaloManual = true */
  saidaIntervalo?: string | null;
  voltaIntervalo?: string | null;
}

export interface RegrasCalculo {
  empresaId: string;
  cargaDiaria: number;
  cargaSemanal: number;
  toleranciaMinutos: number;
  heUtilPercent: number;
  heDomingoFeriadoPercent: number;
  limiteHEMensal: number;
  descontoFaltaPercent: number;
  /** Dia do mes em que a folha fecha (1-28). 0 = mes calendario completo (padrao). */
  diaFechamento: number;
}

export interface Holerite {
  id: string;
  empresaId: string;
  colaboradorId: string;
  mes: string; // YYYY-MM - mes de referencia (mes em que o periodo fecha)
  periodoInicio: string; // YYYY-MM-DD
  periodoFim: string; // YYYY-MM-DD
  diasTrabalhados: number;
  totalHorasNormais: number;
  totalHorasExtras: number; // horas extras a 50% (dias uteis da escala)
  totalHorasExtrasDomingoFeriado: number; // horas extras a 100% (fora da escala/feriado)
  salarioBase: number;
  /** divisor mensal usado para calcular o valor da hora (cargaHoraria x dias/semana x 5) */
  divisorMensal: number;
  /** valor em R$ das horas extras a 50% (dias uteis da escala) */
  valorHorasExtras50: number;
  /** valor em R$ das horas extras a 100% (fora da escala/feriado) */
  valorHorasExtras100: number;
  /** soma de valorHorasExtras50 + valorHorasExtras100 - mantido para compatibilidade com holerites antigos */
  valorHorasExtras: number;
  descontoFaltas: number;
  inss: number;
  fgts: number;
  liquido: number;
  geradoEm: string; // ISO timestamp
}

export interface GozoFerias {
  id: string;
  empresaId: string;
  colaboradorId: string;
  /** indice do periodo aquisitivo a que este gozo se refere - ver calcularPeriodosFerias() */
  periodoIndice: number;
  inicio: string; // YYYY-MM-DD
  fim: string; // YYYY-MM-DD (inclusive)
  dias: number;
  /** valor de 1/30 do salario x dias (CLT Art. 142), na data do registro */
  valorBase: number;
  /** 1/3 constitucional sobre o valor base (CF/88 Art. 7 XVII) */
  tercoConstitucional: number;
  /** valorBase + tercoConstitucional, ja em dobro se pagamentoEmDobro */
  valorTotal: number;
  /** true se o periodo aquisitivo ja estava vencido (concessivo expirado) no momento do registro - da direito a pagamento em dobro (CLT Art. 137, Sumula 81 TST) */
  pagamentoEmDobro: boolean;
  /** true se concedida antes da conclusao dos 12 meses do periodo aquisitivo (adiantamento por decisao do gestor) */
  antecipada: boolean;
  observacao?: string;
  registradoPor: string; // uid do gestor que registrou
  registradoEm: string; // ISO timestamp
}

export interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
}