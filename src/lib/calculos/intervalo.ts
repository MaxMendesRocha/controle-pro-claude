// src/lib/calculos/intervalo.ts
//
// Intervalo intrajornada obrigatorio (Art. 71 da CLT):
// - jornada de ate 4h: sem intervalo obrigatorio
// - jornada de mais de 4h ate 6h: minimo 15 minutos
// - jornada acima de 6h: minimo 1 hora (o padrao legal; reducao para 30min
//   exige acordo/convencao coletiva especifico - nao suportado ainda aqui)
//
// Por padrao, o registro de ponto so tem entrada/saida (sem batida separada
// de intervalo): assumimos que o intervalo esta OCULTO dentro desse
// intervalo de tempo e o descontamos automaticamente do total bruto - isso e
// permitido pela "pre-assinalacao" do Art. 74 par. 2, desde que o intervalo
// seja de fato usufruido na pratica. Por isso existe a flag
// `intervaloNaoUsufruido` no registro: quando marcada, nao descontamos nada,
// e o tempo todo conta como trabalhado (e possivelmente como hora extra).
//
// Colaboradores com `intervaloManual = true` batem a saida/volta do
// intervalo separadamente (ver classificarHorasRegistro em registro.ts), e
// o intervalo real batido substitui essa estimativa quando disponivel. Esta
// mesma funcao tambem e reaproveitada para validar o minimo configuravel
// pelo gestor nesse modo, aplicada sobre a carga horaria contratada.

/** Retorna quantos minutos de intervalo devem ser descontados, dado o total de horas BRUTAS (entrada a saida) do dia */
export function calcularIntervaloMinutos(totalHorasBruto: number): number {
  if (totalHorasBruto > 6) return 60;
  if (totalHorasBruto > 4) return 15;
  return 0;
}