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

  const folhaTexto = totalFolha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Painel do gestor</p>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h2>
      </div>

      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Agora, em tempo real</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-700 text-white p-6 flex flex-col justify-between shadow-lg shadow-emerald-900/10 min-h-[220px]">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-6 -bottom-10 w-32 h-32 rounded-full bg-black/10 blur-2xl" />
          <div className="relative flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <p className="text-sm font-medium text-emerald-50">Trabalhando agora</p>
          </div>
          <div className="relative">
            <p className="text-5xl md:text-6xl font-bold mt-4">{trabalhandoAgora}</p>
            <p className="text-emerald-100 text-sm mt-2">colaborador(es) com ponto aberto hoje</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-sm text-slate-500">Colaboradores Ativos</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{totalAtivos}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-sm text-slate-500">Folha Atual</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{folhaTexto}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-8">
        &quot;Colaboradores Ativos&quot; e &quot;Folha Atual&quot; refletem a configuracao de hoje, nao um historico do periodo selecionado abaixo.
      </p>

      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Horas extras no periodo</p>
        <FiltroMes mesAtual={mesFiltro} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">HE 50%</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Dias uteis
            </span>
          </div>
          <p className="text-3xl font-bold text-amber-600">{horasParaTexto(totalHE50)}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500">HE 100%</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Domingos e feriados
            </span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{horasParaTexto(totalHE100)}</p>
        </div>
      </div>

      {totalAtivos === 0 && (
        <div className="mt-6 p-8 text-center bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500 font-medium">Nenhum colaborador cadastrado ainda</p>
          <p className="text-sm text-slate-400 mt-1">Va em &quot;Colaboradores&quot; para adicionar</p>
        </div>
      )}
    </div>
  );
}