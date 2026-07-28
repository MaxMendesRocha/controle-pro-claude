// src/app/(colaborador)/meu-ponto/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto, formatDateISOBR } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { isDiaExtra } from '@/lib/calculos/diasTrabalho';
import { BaterPontoButton } from '@/components/ponto/BaterPontoButton';
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

  let statusLabel = 'Fora de servico';
  let statusCor = 'bg-surface-2 text-muted';
  let acao: React.ReactNode = <BaterPontoButton tipo="entrada" />;
  let total = '--:--';
  let extras = '--:--';
  let intervaloTexto: string | null = null;

  const hojeEhDiaExtra = colaborador ? isDiaExtra(hojeISO, colaborador.diasTrabalho) : false;

  if (registro?.entrada && registro?.saida && colaborador) {
    statusLabel = 'Jornada finalizada';
    statusCor = 'bg-surface-2 text-muted';
    acao = null;
    const classificacao = classificarHorasRegistro(
      registro.data,
      registro.entrada,
      registro.saida,
      colaborador,
      registro.intervaloNaoUsufruido ?? false
    );
    total = horasParaTexto(classificacao.totalHoras);
    extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
    intervaloTexto = classificacao.intervaloMinutos > 0
      ? `${classificacao.intervaloMinutos} min de intervalo descontados automaticamente`
      : registro.intervaloNaoUsufruido
        ? 'Intervalo marcado como nao usufruido - nada descontado'
        : null;
  } else if (registro?.entrada && !registro?.saida) {
    statusLabel = 'Trabalhando';
    statusCor = 'bg-positive-soft text-positive';
    acao = <BaterPontoButton tipo="saida" />;
  }

  return (
    <div>
      <div className="bg-surface rounded-2xl shadow-lg border border-border p-8 text-center mb-6">
        {hojeEhDiaExtra && statusLabel !== 'Jornada finalizada' && (
          <p className="text-sm text-warning mb-3">
            Hoje esta fora da sua escala normal - horas trabalhadas contam com adicional maior
          </p>
        )}
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${statusCor}`}>
          {statusLabel}
        </span>
        <div>{acao}</div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Resumo de Hoje</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-surface-2 rounded-lg text-center">
            <p className="text-sm text-muted">Entrada</p>
            <p className="text-xl font-bold text-foreground">{registro?.entrada ?? '--:--'}</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg text-center">
            <p className="text-sm text-muted">Saida</p>
            <p className="text-xl font-bold text-foreground">{registro?.saida ?? '--:--'}</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg text-center">
            <p className="text-sm text-muted">Total Trabalhado</p>
            <p className="text-xl font-bold text-positive">{total}</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg text-center">
            <p className="text-sm text-muted">Horas Extras</p>
            <p className="text-xl font-bold text-warning">{extras}</p>
          </div>
        </div>
        {intervaloTexto && (
          <p className="text-xs text-faint text-center mt-4">{intervaloTexto}</p>
        )}
      </div>
    </div>
  );
}