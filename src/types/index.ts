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

export interface Empresa {
  id: string;
  razaoSocial: string;
  cnpj: string;
}