// src/app/(colaborador)/meu-holerite/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto } from '@/lib/calculos/horas';
import { FiltroMes } from '@/components/ponto/FiltroMes';
import { BaixarPdfButton } from '@/components/holerites/BaixarPdfButton';
import type { Colaborador, Holerite } from '@/types';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default async function MeuHoleritePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { mes } = await searchParams;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);
  const docId = `${mesFiltro}_${user.uid}`;

  const [colabDoc, holeriteDoc] = await Promise.all([
    empresaRef.collection('colaboradores').doc(user.uid).get(),
    empresaRef.collection('holerites').doc(docId).get(),
  ]);

  const colaborador = colabDoc.data() as Colaborador | undefined;
  const holerite = holeriteDoc.exists ? (holeriteDoc.data() as Holerite) : null;

  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const temSeparacao = holerite
    ? holerite.valorHorasExtras50 !== undefined && holerite.valorHorasExtras100 !== undefined
    : false;
  const totalVencimentos = holerite ? holerite.salarioBase + holerite.valorHorasExtras : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-2xl font-bold text-gray-900">Meu Holerite</h2>
        <div className="flex gap-2">
          <FiltroMes mesAtual={mesFiltro} />
          {holerite && <BaixarPdfButton docId={docId} />}
        </div>
      </div>

      {!holerite && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          Nenhum holerite disponivel para {mesFiltro} ainda. O holerite aparece aqui assim que o gestor gerar a folha do mes.
        </div>
      )}

      {holerite && colaborador && (
        <div className="max-w-3xl mx-auto bg-white border-2 border-gray-800 rounded-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">RECIBO DE PAGAMENTO</h2>
            <p className="text-sm text-gray-500">Referencia: {holerite.mes}</p>
            {holerite.periodoInicio && holerite.periodoFim && (
              <p className="text-xs text-gray-400">
                Periodo: {formatDateBR(holerite.periodoInicio)} a {formatDateBR(holerite.periodoFim)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-gray-500">Colaborador</p>
              <p className="font-semibold">{colaborador.nome}</p>
              <p className="text-gray-500">Cargo: {colaborador.cargo}</p>
            </div>
            <div>
              <p className="text-gray-500">Admissao</p>
              <p className="font-semibold">{formatDateBR(colaborador.admissao)}</p>
              <p className="text-gray-500">Banco: {colaborador.banco || 'Nao informado'}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left py-2">Descricao</th>
                <th className="text-right py-2">Referencia</th>
                <th className="text-right py-2">Vencimentos</th>
                <th className="text-right py-2">Descontos</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2">Salario Base</td>
                <td className="text-right">{holerite.divisorMensal ? `${holerite.divisorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h` : '220,00h'}</td>
                <td className="text-right">{currency(holerite.salarioBase)}</td>
                <td className="text-right">-</td>
              </tr>

              {temSeparacao ? (
                <>
                  {holerite.totalHorasExtras > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2">Horas Extras 50%</td>
                      <td className="text-right">{horasParaTexto(holerite.totalHorasExtras)}</td>
                      <td className="text-right">{currency(holerite.valorHorasExtras50)}</td>
                      <td className="text-right">-</td>
                    </tr>
                  )}
                  {holerite.totalHorasExtrasDomingoFeriado > 0 && (
                    <tr className="border-b border-gray-200">
                      <td className="py-2">Horas Extras 100%</td>
                      <td className="text-right">{horasParaTexto(holerite.totalHorasExtrasDomingoFeriado)}</td>
                      <td className="text-right">{currency(holerite.valorHorasExtras100)}</td>
                      <td className="text-right">-</td>
                    </tr>
                  )}
                </>
              ) : (
                holerite.valorHorasExtras > 0 && (
                  <tr className="border-b border-gray-200">
                    <td className="py-2">Horas Extras</td>
                    <td className="text-right">
                      {horasParaTexto(holerite.totalHorasExtras + holerite.totalHorasExtrasDomingoFeriado)}
                    </td>
                    <td className="text-right">{currency(holerite.valorHorasExtras)}</td>
                    <td className="text-right">-</td>
                  </tr>
                )
              )}

              {holerite.descontoFaltas > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-2">Desconto de Faltas</td>
                  <td className="text-right">-</td>
                  <td className="text-right">-</td>
                  <td className="text-right text-red-600">{currency(holerite.descontoFaltas)}</td>
                </tr>
              )}
              <tr className="border-b border-gray-200">
                <td className="py-2">INSS</td>
                <td className="text-right">-</td>
                <td className="text-right">-</td>
                <td className="text-right text-red-600">{currency(holerite.inss)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-center border-t-2 border-gray-800 pt-4">
            <div>
              <p className="text-sm text-gray-500">Total de Vencimentos</p>
              <p className="font-bold text-lg">{currency(totalVencimentos)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total de Descontos</p>
              <p className="font-bold text-lg text-red-600">{currency(holerite.inss + holerite.descontoFaltas)}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-emerald-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Valor Liquido a Receber</p>
            <p className="text-3xl font-bold text-emerald-600">{currency(holerite.liquido)}</p>
          </div>

          <div className="mt-6 text-xs text-gray-400 text-center">
            <p>Dias trabalhados: {holerite.diasTrabalhados} | Carga horaria: {colaborador.cargaHoraria}h/dia</p>
            <p>FGTS do periodo (informativo, pago pelo empregador): {currency(holerite.fgts)}</p>
          </div>
        </div>
      )}
    </div>
  );
}