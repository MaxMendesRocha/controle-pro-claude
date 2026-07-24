import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto, formatDateISO } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { FiltroMes } from '@/components/ponto/FiltroMes';
import type { Colaborador, RegistroPonto } from '@/types';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null; // middleware ja protege; guarda extra por seguranca de tipos

  const { mes } = await searchParams;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colaboradoresSnap, registrosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').get(),
    empresaRef.collection('registros').get(),
  ]);

  const colaboradores = colaboradoresSnap.docs.map((d) => d.data() as Colaborador);
  const registros = registrosSnap.docs.map((d) => d.data() as RegistroPonto);

  const totalAtivos = colaboradores.filter((c) => c.ativo).length;

  const hoje = formatDateISO(new Date());
  const trabalhandoAgora = registros.filter((r) => r.data === hoje && r.entrada && !r.saida).length;

  let totalHE50 = 0;
  let totalHE100 = 0;
  let totalFolha = 0;

  colaboradores.forEach((c) => {
    totalFolha += c.salarioBase;
    const regsDoPeriodo = registros.filter(
      (r) => r.colaboradorId === c.uid && r.data.startsWith(mesFiltro) && r.entrada && r.saida
    );
    regsDoPeriodo.forEach((r) => {
      const classificacao = classificarHorasRegistro(r.data, r.entrada!, r.saida!, c, r.intervaloNaoUsufruido ?? false);
      if (classificacao.ehDiaExtra) {
        totalHE100 += classificacao.horasExtras;
      } else {
        totalHE50 += classificacao.horasExtras;
      }
    });
  });

  const cardsTempoReal = [
    { label: 'Colaboradores Ativos', valor: totalAtivos.toString(), cor: 'text-gray-900' },
    { label: 'Trabalhando Agora', valor: trabalhandoAgora.toString(), cor: 'text-emerald-600' },
    {
      label: 'Folha Atual',
      valor: totalFolha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      cor: 'text-gray-900',
    },
  ];

  const cardsPeriodo = [
    { label: 'HE 50%', valor: horasParaTexto(totalHE50), cor: 'text-amber-600' },
    { label: 'HE 100%', valor: horasParaTexto(totalHE100), cor: 'text-purple-600' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      </div>

      <div className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Agora (tempo real)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cardsTempoReal.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-2xl font-bold ${card.cor}`}>{card.valor}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          &quot;Colaboradores Ativos&quot; e &quot;Folha Atual&quot; refletem a configuracao de hoje, nao um historico do periodo selecionado abaixo.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Horas extras no periodo</p>
          <FiltroMes mesAtual={mesFiltro} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cardsPeriodo.map((card) => (
            <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className={`text-2xl font-bold ${card.cor}`}>{card.valor}</p>
            </div>
          ))}
        </div>
      </div>

      {totalAtivos === 0 && (
        <div className="mt-6 p-8 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 font-medium">Nenhum colaborador cadastrado ainda</p>
          <p className="text-sm text-gray-400 mt-1">Va em &quot;Colaboradores&quot; para adicionar</p>
        </div>
      )}
    </div>
  );
}