// src/lib/calculos/feriados.ts

/**
 * Feriados nacionais fixos do Brasil (dia e mes nao mudam de ano para ano).
 * Feriados moveis (Carnaval, Sexta-feira Santa, Corpus Christi) dependem da
 * data da Pascoa e podem ser adicionados depois com um calculo separado.
 * Feriados municipais/estaduais tambem ficam fora por enquanto -
 * seriam configuraveis por empresa em uma versao futura.
 */
const FERIADOS_NACIONAIS_FIXOS = [
  '01-01', // Confraternizacao Universal
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independencia do Brasil
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamacao da Republica
  '11-20', // Consciencia Negra (feriado nacional desde 2024)
  '12-25', // Natal
];

/** Recebe uma data no formato "YYYY-MM-DD" e retorna true se for domingo ou feriado nacional fixo */
export function isDomingoOuFeriado(dataISO: string): boolean {
  const diaSemana = new Date(dataISO + 'T12:00:00').getDay();
  if (diaSemana === 0) return true;

  const mesDia = dataISO.slice(5, 10); // "MM-DD"
  return FERIADOS_NACIONAIS_FIXOS.includes(mesDia);
}
