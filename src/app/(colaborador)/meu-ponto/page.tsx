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
  let statusCor = 'bg-gray-100 text-gray-600';
  let acao: React.ReactNode = <BaterPontoButton tipo="entrada" />;
  let total = '--:--';
  let extras = '--:--';

  const hojeEhDiaExtra = colaborador ? isDiaExtra(hojeISO, colaborador.diasTrabalho) : false;

  if (registro?.entrada && registro?.saida && colaborador) {
    statusLabel = 'Jornada finalizada';
    statusCor = 'bg-gray-100 text-gray-600';
    acao = null;
    const classificacao = classificarHorasRegistro(registro.data, registro.entrada, registro.saida, colaborador);
    total = horasParaTexto(classificacao.totalHoras);
    extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
  } else if (registro?.entrada && !registro?.saida) {
    statusLabel = 'Trabalhando';
    statusCor = 'bg-emerald-100 text-emerald-700';
    acao = <BaterPontoButton tipo="saida" />;
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center mb-6">
        {hojeEhDiaExtra && statusLabel !== 'Jornada finalizada' && (
          <p className="text-sm text-amber-600 mb-3">
            Hoje esta fora da sua escala normal - horas trabalhadas contam com adicional maior
          </p>
        )}
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-6 ${statusCor}`}>
          {statusLabel}
        </span>
        <div>{acao}</div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo de Hoje</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Entrada</p>
            <p className="text-xl font-bold text-gray-900">{registro?.entrada ?? '--:--'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Saida</p>
            <p className="text-xl font-bold text-gray-900">{registro?.saida ?? '--:--'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Total Trabalhado</p>
            <p className="text-xl font-bold text-emerald-600">{total}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">Horas Extras</p>
            <p className="text-xl font-bold text-amber-600">{extras}</p>
          </div>
        </div>
      </div>
    </div>
  );
}