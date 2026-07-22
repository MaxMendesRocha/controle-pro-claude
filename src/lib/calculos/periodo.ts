// src/lib/calculos/periodo.ts
//
// Calcula o periodo (data inicio/fim) de uma folha de pagamento a partir de
// um mes de referencia ("YYYY-MM") e um dia de fechamento configurado pela empresa.
//
// diaFechamento = 0 (ou nao definido): periodo = mes calendario completo
//   (ex: mes="2026-07" -> inicio="2026-07-01", fim="2026-07-31")
//
// diaFechamento = 1-28: periodo fecha nesse dia do MES DE REFERENCIA e comeca
//   no dia seguinte do mes anterior
//   (ex: mes="2026-07", diaFechamento=25 -> inicio="2026-06-26", fim="2026-07-25")
//
// Limitamos diaFechamento a 1-28 (nao 29-31) de proposito: dias fixos acima de 28
// se comportam de forma inconsistente em meses mais curtos (fevereiro, por exemplo),
// entao pedimos ao gestor para escolher um dia dentro da faixa segura em todos os meses.

export interface PeriodoFolha {
  inicio: string; // YYYY-MM-DD
  fim: string; // YYYY-MM-DD
}

function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function calcularPeriodo(mesReferencia: string, diaFechamento: number): PeriodoFolha {
  const [ano, mes] = mesReferencia.split('-').map(Number);

  if (!diaFechamento || diaFechamento <= 0) {
    // mes calendario completo
    const inicio = `${mesReferencia}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const fim = `${mesReferencia}-${String(ultimoDia).padStart(2, '0')}`;
    return { inicio, fim };
  }

  // mes e 1-indexado no formato "YYYY-MM"; Date usa mes 0-indexado
  const fimDate = new Date(ano, mes - 1, diaFechamento);
  const inicioDate = new Date(ano, mes - 2, diaFechamento + 1);

  return { inicio: formatarData(inicioDate), fim: formatarData(fimDate) };
}