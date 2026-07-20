export type Role = 'gestor' | 'colaborador';

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
}

export interface Holerite {
  id: string;
  empresaId: string;
  colaboradorId: string;
  mes: string; // YYYY-MM
  diasTrabalhados: number;
  totalHorasNormais: number;
  totalHorasExtras: number;
  totalHorasExtrasDomingoFeriado: number;
  salarioBase: number;
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