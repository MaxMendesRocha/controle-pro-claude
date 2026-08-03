import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto, formatDateISO } from '@/lib/calculos/horas';
import { classificarHorasRegistro } from '@/lib/calculos/registro';
import { FiltroMes } from '@/components/ponto/FiltroMes';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Icon } from '@/components/ui/icons';
import type { Colaborador, RegistroPonto } from '@/types';

interface ColabExtra {
  nome: string;
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

  let totalHE50 = 0;
  let totalHE100 = 0;
  let totalFolha = 0;
  const porColaborador: ColabExtra[] = [];

  colaboradores.forEach((c) => {
    totalFolha += c.salarioBase;
    const regsDoPeriodo = registros.filter(
      (r) => r.colaboradorId === c.uid && r.data.startsWith(mesFiltro) && r.entrada && r.saida
    );
    let he50Colab = 0;
    let he100Colab = 0;
    regsDoPeriodo.forEach((r) => {
      const classificacao = classificarHorasRegistro(
        r.data, r.entrada!, r.saida!, c, r.intervaloNaoUsufruido ?? false, r.saidaIntervalo, r.voltaIntervalo
      );
      if (classificacao.ehDiaExtra) {
        he100Colab += classificacao.horasExtras;
      } else {
        he50Colab += classificacao.horasExtras;
      }
    });
    totalHE50 += he50Colab;
    totalHE100 += he100Colab;
    if (he50Colab + he100Colab > 0) {
      porColaborador.push({ nome: c.nome, he50: he50Colab, he100: he100Colab });
    }
  });

  porColaborador.sort((a, b) => b.he50 + b.he100 - (a.he50 + a.he100));
  const rankingExtras = porColaborador.slice(0, 6);
  const maxColab = Math.max(1, ...rankingExtras.map((c) => c.he50 + c.he100));

  const proporcaoTrabalhando = totalAtivos > 0 ? trabalhandoAgora / totalAtivos : 0;

  return (
    <div className="space-y-4">
      {/* Card ao vivo: quem esta trabalhando agora */}
      <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface p-5">
        <ProgressRing value={proporcaoTrabalhando} size={92} strokeWidth={9} progressClassName="text-positive">
          <span className="text-lg font-bold text-positive">{trabalhandoAgora}</span>
          <span className="text-[10px] text-faint">de {totalAtivos}</span>
        </ProgressRing>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-faint">
            <span className="h-1.5 w-1.5 animate-live-pulse rounded-full bg-positive" />
            Agora, em tempo real
          </div>
          <p className="mt-1 text-lg font-bold">Trabalhando agora</p>
          <p className="text-sm text-muted">
            {trabalhandoAgora} colaborador{trabalhandoAgora === 1 ? '' : 'es'} com ponto aberto hoje
          </p>
        </div>
      </div>

      {/* Stats compactas lado a lado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
            <Icon name="colaboradores" className="h-4 w-4" />
          </div>
          <p className="text-xs text-muted">Colaboradores Ativos</p>
          <p className="text-xl font-bold text-accent-ink">{totalAtivos}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <p className="text-xs text-muted">Folha Atual</p>
          <p className="text-lg font-bold">
            {totalFolha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Horas extras no periodo */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Horas extras no periodo</p>
          <FiltroMes mesAtual={mesFiltro} />
        </div>

        <div className="mb-4 flex flex-wrap gap-6">
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

        {rankingExtras.length === 0 ? (
          <p className="py-4 text-center text-sm text-faint">Ninguem fez horas extras neste periodo.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-faint">Quem mais fez hora extra</p>
            {rankingExtras.map((c) => {
              const total = c.he50 + c.he100;
              const larguraTotal = (total / maxColab) * 100;
              const larguraHE50 = total > 0 ? (c.he50 / total) * larguraTotal : 0;
              const larguraHE100 = larguraTotal - larguraHE50;
              return (
                <div key={c.nome}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-foreground">{c.nome}</span>
                    <span className="shrink-0 text-faint">{horasParaTexto(total)}</span>
                  </div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="bg-warning transition-[width]" style={{ width: `${larguraHE50}%` }} />
                    <div className="bg-special transition-[width]" style={{ width: `${larguraHE100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-faint">
        &quot;Colaboradores Ativos&quot; e &quot;Folha Atual&quot; refletem a configuracao de hoje, nao um historico do periodo selecionado acima.
      </p>

      {totalAtivos === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="font-medium text-muted">Nenhum colaborador cadastrado ainda</p>
          <p className="mt-1 text-sm text-faint">Va em &quot;Colaboradores&quot; para adicionar</p>
        </div>
      )}
    </div>
  );
}
