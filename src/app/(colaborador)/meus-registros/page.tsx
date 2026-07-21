// src/app/(colaborador)/meus-registros/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { FiltroMes } from '@/components/ponto/FiltroMes';
import { FormRegistroManual } from '@/components/ponto/FormRegistroManual';
import type { RegistroPonto, Colaborador } from '@/types';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default async function MeusRegistrosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { mes } = await searchParams;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colabDoc, registrosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').doc(user.uid).get(),
    empresaRef
      .collection('registros')
      .where('colaboradorId', '==', user.uid)
      .get(),
  ]);

  const colaborador = colabDoc.data() as Colaborador | undefined;
  const registros = registrosSnap.docs
    .map((d) => d.data() as RegistroPonto)
    .filter((r) => r.data.startsWith(mesFiltro))
    .sort((a, b) => b.data.localeCompare(a.data));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Meus Registros</h2>
        <div className="flex gap-2 items-center">
          <FiltroMes mesAtual={mesFiltro} />
          <FormRegistroManual />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saida</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extras</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registros.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum registro neste mes</td>
                </tr>
              )}
              {registros.map((r, i) => {
                let total = '--:--';
                let extras = '--:--';
                let status = { label: 'Incompleto', cor: 'bg-gray-100 text-gray-600' };
                let ehDiaExtra = false;

                if (r.entrada && r.saida && colaborador) {
                  const classificacao = classificarHorasRegistro(r.data, r.entrada, r.saida, colaborador);
                  total = horasParaTexto(classificacao.totalHoras);
                  extras = classificacao.horasExtras > 0 ? horasParaTexto(classificacao.horasExtras) : '--:--';
                  ehDiaExtra = classificacao.ehDiaExtra;
                  status = { label: 'Completo', cor: 'bg-green-100 text-green-700' };
                } else if (r.entrada && !r.saida) {
                  status = { label: 'Em andamento', cor: 'bg-blue-100 text-blue-700' };
                }

                return (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateBR(r.data)}
                      {ehDiaExtra && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                          Extra
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.entrada ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.saida ?? '--:--'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{total}</td>
                    <td className="px-6 py-4 text-sm text-amber-600 font-medium">{extras}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.cor}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}