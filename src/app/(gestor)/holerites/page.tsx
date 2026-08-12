// src/app/(gestor)/holerites/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto } from '@/lib/calculos/horas';
import { GerarHoleritesButton } from '@/components/holerites/GerarHoleritesButton';
import { FiltrosHolerites } from '@/components/holerites/FiltrosHolerites';
import { BaixarPdfButton } from '@/components/holerites/BaixarPdfButton';
import type { Colaborador, Holerite } from '@/types';

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export default async function HoleritesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; colaboradorId?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { mes, colaboradorId } = await searchParams;
  const mesFiltro = mes || new Date().toISOString().slice(0, 7);
  const colaboradorIdFiltro = colaboradorId || '';

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colaboradoresSnap, holeritesSnap] = await Promise.all([
    empresaRef.collection('colaboradores').get(),
    empresaRef.collection('holerites').where('mes', '==', mesFiltro).get(),
  ]);

  const colaboradores = colaboradoresSnap.docs
    .map((d) => d.data() as Colaborador)
    .filter((c) => c.role === 'colaborador');

  const colaboradoresPorId = new Map(colaboradores.map((c) => [c.uid, c]));

  let holerites = holeritesSnap.docs.map((d) => d.data() as Holerite);
  if (colaboradorIdFiltro) {
    holerites = holerites.filter((h) => h.colaboradorId === colaboradorIdFiltro);
  }
  holerites.sort((a, b) => {
    const nomeA = colaboradoresPorId.get(a.colaboradorId)?.nome || '';
    const nomeB = colaboradoresPorId.get(b.colaboradorId)?.nome || '';
    return nomeA.localeCompare(nomeB);
  });

  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-foreground">Holerites</h2>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <FiltrosHolerites
              colaboradores={colaboradores}
              mesAtual={mesFiltro}
              colaboradorIdAtual={colaboradorIdFiltro}
            />
            <GerarHoleritesButton />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {holerites.length === 0 && (
          <div className="col-span-2 text-center py-12 text-faint bg-surface rounded-xl border border-border">
            Nenhum holerite gerado para este periodo
          </div>
        )}

        {holerites.map((h) => {
          const colaborador = colaboradoresPorId.get(h.colaboradorId);
          // fallback para holerites gerados antes da separacao 50%/100% existir
          const temSeparacao = h.valorHorasExtras50 !== undefined && h.valorHorasExtras100 !== undefined;

          return (
            <div key={h.id} className="bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="p-4 bg-surface-2 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-sm font-bold text-accent-ink">
                    {colaborador?.nome?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{colaborador?.nome ?? 'Colaborador removido'}</p>
                    <p className="text-xs text-faint">{colaborador?.cargo ?? ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-muted block">{h.mes}</span>
                  {h.periodoInicio && h.periodoFim && (
                    <span className="text-xs text-faint">
                      {formatDateBR(h.periodoInicio)} a {formatDateBR(h.periodoFim)}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Salario Base</span>
                  <span className="font-medium text-foreground">{currency(h.salarioBase)}</span>
                </div>

                {temSeparacao ? (
                  <>
                    {h.totalHorasExtras > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">HE 50% ({horasParaTexto(h.totalHorasExtras)})</span>
                        <span className="font-medium text-warning">+ {currency(h.valorHorasExtras50)}</span>
                      </div>
                    )}
                    {h.totalHorasExtrasDomingoFeriado > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted">HE 100% ({horasParaTexto(h.totalHorasExtrasDomingoFeriado)})</span>
                        <span className="font-medium text-special">+ {currency(h.valorHorasExtras100)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  h.valorHorasExtras > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">
                        Horas Extras ({horasParaTexto(h.totalHorasExtras + h.totalHorasExtrasDomingoFeriado)})
                      </span>
                      <span className="font-medium text-warning">+ {currency(h.valorHorasExtras)}</span>
                    </div>
                  )
                )}

                {(h.feriasValorBase ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Ferias - Gozadas no mes ({h.feriasDias}d)</span>
                    <span className="font-medium text-positive">+ {currency(h.feriasValorBase)}</span>
                  </div>
                )}
                {(h.feriasTercoConstitucional ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Ferias - Adicional 1/3</span>
                    <span className="font-medium text-positive">+ {currency(h.feriasTercoConstitucional)}</span>
                  </div>
                )}
                {(h.compensacaoProvisaoInss ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Compensacao de Provisao de INSS - Ferias</span>
                    <span className="font-medium text-positive">+ {currency(h.compensacaoProvisaoInss)}</span>
                  </div>
                )}

                {h.descontoFaltas > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Desconto Faltas</span>
                    <span className="font-medium text-critical">- {currency(h.descontoFaltas)}</span>
                  </div>
                )}
                {(h.descontoDiasFerias ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Desconto Dias de Ferias</span>
                    <span className="font-medium text-critical">- {currency(h.descontoDiasFerias)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">INSS</span>
                  <span className="font-medium text-critical">- {currency(h.inss)}</span>
                </div>
                {(h.adiantamentoFerias ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Adiantamento de Ferias</span>
                    <span className="font-medium text-critical">- {currency(h.adiantamentoFerias)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-faint">
                  <span>FGTS (informativo, pago pelo empregador)</span>
                  <span>{currency(h.fgts)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold text-foreground">Total a Receber</span>
                  <span className="font-bold text-positive text-lg">{currency(h.liquido)}</span>
                </div>
                <div className="pt-2">
                  <BaixarPdfButton docId={h.id} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}