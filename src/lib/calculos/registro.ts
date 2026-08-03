// src/lib/calculos/registro.ts
import { calcularDiferencaHoras } from './horas';
import { isDiaExtra } from './diasTrabalho';
import { calcularIntervaloMinutos } from './intervalo';
import type { Colaborador } from '@/types';

export interface ClassificacaoHoras {
  totalHorasBruto: number; // diferenca crua entre entrada e saida, sem descontar intervalo
  intervaloMinutos: number; // minutos de intervalo descontados
  totalHoras: number; // horas efetivamente trabalhadas (bruto - intervalo)
  horasNormais: number;
  horasExtras: number;
  ehDiaExtra: boolean; // true = sabado/domingo/feriado (fora da escala do colaborador)
  /** true = colaborador esta no modo de intervalo manual, mas nao bateu saida/volta do intervalo neste dia (e nao marcou "nao usufruido") */
  faltamBatidasIntervalo: boolean;
  /** true = intervalo manual batido, mas ficou abaixo do minimo configurado pelo gestor */
  intervaloAbaixoDoMinimo: boolean;
}

type ColaboradorParaClassificacao = Pick<
  Colaborador,
  'cargaHoraria' | 'diasTrabalho' | 'intervaloManual' | 'duracaoIntervaloMinutos'
>;

/**
 * Classifica as horas de um registro de ponto (entrada/saida de um dia) em
 * normais vs extras, aplicando primeiro o desconto de intervalo intrajornada
 * (Art. 71 CLT) e depois respeitando a escala de trabalho do colaborador e o
 * calendario de feriados. Usar esta funcao em qualquer tela que precise
 * mostrar "horas trabalhadas"/"horas extras" de um registro, para manter
 * consistencia com o motor de calculo de holerite.
 *
 * Colaboradores com `intervaloManual` batem a saida/volta do intervalo
 * separadamente; quando essas batidas existem, o intervalo real (batido) e
 * usado no lugar da estimativa automatica. Se faltarem e o colaborador nao
 * tiver marcado "nao usufruido", cai de volta na estimativa automatica mas
 * sinaliza `faltamBatidasIntervalo` para a tela avisar o usuario.
 */
export function classificarHorasRegistro(
  data: string,
  entrada: string,
  saida: string,
  colaborador: ColaboradorParaClassificacao,
  intervaloNaoUsufruido: boolean = false,
  saidaIntervalo?: string | null,
  voltaIntervalo?: string | null
): ClassificacaoHoras {
  const totalHorasBruto = calcularDiferencaHoras(entrada, saida);

  let intervaloMinutos: number;
  let faltamBatidasIntervalo = false;
  let intervaloAbaixoDoMinimo = false;

  if (colaborador.intervaloManual && saidaIntervalo && voltaIntervalo) {
    intervaloMinutos = calcularDiferencaHoras(saidaIntervalo, voltaIntervalo) * 60;
    const minimo = colaborador.duracaoIntervaloMinutos ?? 0;
    if (intervaloMinutos < minimo) intervaloAbaixoDoMinimo = true;
  } else {
    intervaloMinutos = intervaloNaoUsufruido ? 0 : calcularIntervaloMinutos(totalHorasBruto);
    if (colaborador.intervaloManual && !intervaloNaoUsufruido) {
      faltamBatidasIntervalo = true;
    }
  }

  const totalHoras = Math.max(0, totalHorasBruto - intervaloMinutos / 60);

  const ehDiaExtra = isDiaExtra(data, colaborador.diasTrabalho);

  if (ehDiaExtra) {
    // fora da escala normal (sabado/domingo/feriado): tudo conta como extra
    return {
      totalHorasBruto,
      intervaloMinutos,
      totalHoras,
      horasNormais: 0,
      horasExtras: totalHoras,
      ehDiaExtra: true,
      faltamBatidasIntervalo,
      intervaloAbaixoDoMinimo,
    };
  }

  const horasNormais = Math.min(totalHoras, colaborador.cargaHoraria);
  const horasExtras = Math.max(0, totalHoras - horasNormais);
  return {
    totalHorasBruto,
    intervaloMinutos,
    totalHoras,
    horasNormais,
    horasExtras,
    ehDiaExtra: false,
    faltamBatidasIntervalo,
    intervaloAbaixoDoMinimo,
  };
}
