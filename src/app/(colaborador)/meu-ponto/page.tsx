// src/app/(colaborador)/meu-ponto/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto, formatDateISOBR, formatTimeBR, parseTime } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { isDiaExtra } from '@/lib/calculos/diasTrabalho';
import { BaterPontoButton } from '@/components/ponto/BaterPontoButton';
import { ProgressRing } from '@/components/ui/ProgressRing';
import type { RegistroPonto, Colaborador } from '@/types';

export default async function MeuPontoPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);
  const hojeISO = formatDateISOBR(new Date());

  const [colabDoc, registroSnap] = await Promise.all([
    empresaRef.collection('colaboradores').doc(user.uid).get(),
    empresaRef
      .collection('registros')
      .where('colaboradorId', '==', user.uid)
      .where('data', '==', hojeISO)
      .limit(1)
      .get(),
  ]);

  const colaborador = colabDoc.data() as Colaborador | undefined;
  const registro = registroSnap.empty ? null : (registroSnap.docs[0].data() as RegistroPonto);
  const intervaloManual = colaborador?.intervaloManual ?? false;

  let statusLabel = 'Fora de servico';
  let statusCor = 'bg-surface-2 text-muted';
  let acao: React.ReactNode = <BaterPontoButton tipo="entrada" />;
  let total = '--:--';
  let extras = '--:--';
  let intervaloTexto: string | null = null;
  let avisoIntervalo: string | null = null;
  let horasTrabalhadas = 0;

  const hojeEhDiaExtra = colaborador ? isDiaExtra(hojeISO, colaborador.diasTrabalho) : false;
  const metaDiaria = colaborador?.cargaHoraria ?? 8;
  const agora = formatTimeBR(new Date());

  if (registro?.entrada && registro?.saida && colaborador) {
    statusLabel = 'Jornada finalizada';
    statusCor = 'bg-surface-2 text-muted';
    acao = null;
    const classificacao = classificarHorasRegistro(
      registro.data,
      registro.entrada,
      registro.saida,
      colaborador,
      registro.intervaloNaoUsufruido ?? false,
      registro.saidaIntervalo,
      registro.voltaIntervalo
    );
    horasTrabalhadas = classificacao.totalHoras;
    total = horasParaTexto(classificacao.totalHoras);
    extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
    intervaloTexto = classificacao.intervaloMinutos > 0
      ? `${classificacao.intervaloMinutos} min de intervalo descontados`
      : registro.intervaloNaoUsufruido
        ? 'Intervalo marcado como nao usufruido - nada descontado'
        : null;

    if (classificacao.faltamBatidasIntervalo) {
      avisoIntervalo = 'Faltam as batidas de saida/volta do intervalo neste dia. Complete em "Meus Registros".';
    } else if (classificacao.intervaloAbaixoDoMinimo) {
      avisoIntervalo = `Intervalo registrado ficou abaixo do minimo configurado (${colaborador.duracaoIntervaloMinutos} min).`;
    }
  } else if (registro?.entrada && intervaloManual && registro.saidaIntervalo && !registro.voltaIntervalo) {
    // Em intervalo
    statusLabel = 'Em intervalo';
    statusCor = 'bg-accent-soft text-accent-ink';
    acao = <BaterPontoButton tipo="volta-intervalo" />;
    horasTrabalhadas = Math.max(0, parseTime(registro.saidaIntervalo) - parseTime(registro.entrada));
  } else if (registro?.entrada && intervaloManual && registro.voltaIntervalo && !registro.saida) {
    // Trabalhando, pos-intervalo
    statusLabel = 'Trabalhando';
    statusCor = 'bg-positive-soft text-positive';
    acao = <BaterPontoButton tipo="saida" />;
    const antesDoIntervalo = Math.max(0, parseTime(registro.saidaIntervalo!) - parseTime(registro.entrada));
    const depoisDoIntervalo = Math.max(0, parseTime(agora) - parseTime(registro.voltaIntervalo));
    horasTrabalhadas = antesDoIntervalo + depoisDoIntervalo;
  } else if (registro?.entrada && !registro?.saida) {
    // Trabalhando, ainda sem intervalo batido
    statusLabel = 'Trabalhando';
    statusCor = 'bg-positive-soft text-positive';
    horasTrabalhadas = Math.max(0, parseTime(agora) - parseTime(registro.entrada));

    if (intervaloManual) {
      acao = (
        <div className="space-y-2">
          <BaterPontoButton tipo="saida-intervalo" />
          <div>
            <p className="text-xs text-faint mb-2">ou, se nao vai fazer intervalo hoje:</p>
            <BaterPontoButton tipo="saida" permitirPularIntervalo />
          </div>
        </div>
      );
    } else {
      acao = <BaterPontoButton tipo="saida" permitirPularIntervalo />;
    }
  }

  const progresso = metaDiaria > 0 ? horasTrabalhadas / metaDiaria : 0;
  const ringCor = statusLabel === 'Trabalhando' ? 'text-positive' : statusLabel === 'Em intervalo' ? 'text-accent-ink' : 'text-accent';

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center">
        {hojeEhDiaExtra && statusLabel !== 'Jornada finalizada' && (
          <p className="mb-3 text-sm text-warning">
            Hoje esta fora da sua escala normal - horas trabalhadas contam com adicional maior
          </p>
        )}

        <ProgressRing value={progresso} size={148} strokeWidth={12} progressClassName={ringCor}>
          <span className={`text-2xl font-bold ${ringCor}`}>
            {total !== '--:--' ? total : horasParaTexto(horasTrabalhadas)}
          </span>
          <span className="text-[11px] text-faint">meta {horasParaTexto(metaDiaria)}</span>
        </ProgressRing>

        <span className={`mt-4 mb-5 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium ${statusCor}`}>
          {statusLabel}
        </span>
        <div className="w-full">{acao}</div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-faint">Resumo de Hoje</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-2 p-4 text-center">
            <p className="text-sm text-muted">Entrada</p>
            <p className="text-xl font-bold">{registro?.entrada ?? '--:--'}</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-4 text-center">
            <p className="text-sm text-muted">Saida</p>
            <p className="text-xl font-bold">{registro?.saida ?? '--:--'}</p>
          </div>
          {intervaloManual && (
            <>
              <div className="rounded-xl bg-surface-2 p-4 text-center">
                <p className="text-sm text-muted">Saida Intervalo</p>
                <p className="text-xl font-bold">{registro?.saidaIntervalo ?? '--:--'}</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-4 text-center">
                <p className="text-sm text-muted">Volta Intervalo</p>
                <p className="text-xl font-bold">{registro?.voltaIntervalo ?? '--:--'}</p>
              </div>
            </>
          )}
          <div className="rounded-xl bg-surface-2 p-4 text-center">
            <p className="text-sm text-muted">Total Trabalhado</p>
            <p className="text-xl font-bold text-positive">{total}</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-4 text-center">
            <p className="text-sm text-muted">Horas Extras</p>
            <p className="text-xl font-bold text-warning">{extras}</p>
          </div>
        </div>
        {intervaloTexto && <p className="mt-4 text-center text-xs text-faint">{intervaloTexto}</p>}
        {avisoIntervalo && <p className="mt-2 text-center text-xs text-warning">{avisoIntervalo}</p>}
      </div>
    </div>
  );
}
