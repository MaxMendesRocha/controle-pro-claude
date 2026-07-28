import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto, formatDateISO } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { FiltroMes } from '@/components/ponto/FiltroMes';
import type { Colaborador, RegistroPonto } from '@/types';

interface DiaExtra {
  dia: number;
  he50: number;
  he100: number;
}

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

  const [anoFiltro, mesNumFiltro] = mesFiltro.split('-').map(Number);
  const diasNoMes = new Date(anoFiltro, mesNumFiltro, 0).getDate();
  const diario: DiaExtra[] = Array.from({ length: diasNoMes }, (_, i) => ({ dia: i + 1, he50: 0, he100: 0 }));

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
      const diaIdx = Number(r.data.slice(8, 10)) - 1;
      if (classificacao.ehDiaExtra) {
        totalHE100 += classificacao.horasExtras;
        if (diario[diaIdx]) diario[diaIdx].he100 += classificacao.horasExtras;
      } else {
        totalHE50 += classificacao.horasExtras;
        if (diario[diaIdx]) diario[diaIdx].he50 += classificacao.horasExtras;
      }
    });
  });

  const maxDia = Math.max(1, ...diario.map((d) => d.he50 + d.he100));
  const diaHojeNum = hoje.startsWith(mesFiltro) ? Number(hoje.slice(8, 10)) : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-faint">
        <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-positive" />
        Agora, em tempo real
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[140px]">
        {/* Card grande: horas extras no periodo */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:col-span-2 lg:col-span-2 lg:row-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Horas extras no periodo</p>
            <FiltroMes mesAtual={mesFiltro} />
          </div>

          <div className="flex h-40 items-end gap-[3px] border-b border-border/60">
            {diario.map((d) => {
              const total = d.he50 + d.he100;
              const alturaTotal = (total / maxDia) * 100;
              const alturaHE100 = total > 0 ? (d.he100 / total) * alturaTotal : 0;
              const alturaHE50 = alturaTotal - alturaHE100;
              const isHoje = d.dia === diaHojeNum;
              return (
                <div
                  key={d.dia}
                  className="group relative flex-1"
                  title={`Dia ${d.dia}: ${horasParaTexto(total)} extra`}
                >
                  <div className="flex h-40 flex-col-reverse">
                    <div
                      className={`rounded-t-[2px] bg-warning transition-opacity ${total === 0 ? '' : 'group-hover:opacity-80'}`}
                      style={{ height: `${alturaHE50}%` }}
                    />
                    <div
                      className={`rounded-t-[2px] bg-special transition-opacity ${total === 0 ? '' : 'group-hover:opacity-80'}`}
                      style={{ height: `${alturaHE100}%` }}
                    />
                  </div>
                  {isHoje && <div className="absolute -bottom-[3px] left-0 right-0 h-[2px] rounded-full bg-accent" />}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              <div>
                <p className="text-[11px] text-faint">HE 50%</p>
                <p className="text-sm font-semibold text-warning">{horasParaTexto(totalHE50)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-special" />
              <div>
                <p className="text-[11px] text-faint">HE 100%</p>
                <p className="text-sm font-semibold text-special">{horasParaTexto(totalHE100)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Colaboradores ativos */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted">Colaboradores Ativos</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold">{totalAtivos}</p>
        </div>

        {/* Trabalhando agora */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted">Trabalhando Agora</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-positive-soft text-positive">
              <span className="h-2 w-2 animate-live-pulse rounded-full bg-positive" />
            </div>
          </div>
          <p className="text-2xl font-bold text-positive">{trabalhandoAgora}</p>
        </div>

        {/* Folha atual */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 sm:col-span-2 lg:col-span-2">
          <div className="flex items-start justify-between">
            <p className="text-sm text-muted">Folha Atual</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold">
            {totalFolha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-faint">
        &quot;Colaboradores Ativos&quot; e &quot;Folha Atual&quot; refletem a configuracao de hoje, nao um historico do periodo selecionado acima.
      </p>

      {totalAtivos === 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-medium text-muted">Nenhum colaborador cadastrado ainda</p>
          <p className="mt-1 text-sm text-faint">Va em &quot;Colaboradores&quot; para adicionar</p>
        </div>
      )}
    </div>
  );
}
