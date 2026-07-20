import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { calcularDiferencaHoras, horasParaTexto, formatDateISO } from '@/lib/calculos/horas';
import type { Colaborador, RegistroPonto } from '@/types';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null; // middleware ja protege; guarda extra por seguranca de tipos

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

  const mesAtual = new Date().toISOString().slice(0, 7);
  let totalHE = 0;
  let totalFolha = 0;

  colaboradores.forEach((c) => {
    totalFolha += c.salarioBase;
    const regsDoMes = registros.filter(
      (r) => r.colaboradorId === c.uid && r.data.startsWith(mesAtual) && r.entrada && r.saida
    );
    regsDoMes.forEach((r) => {
      const total = calcularDiferencaHoras(r.entrada!, r.saida!);
      const normal = Math.min(total, c.cargaHoraria);
      totalHE += Math.max(0, total - normal);
    });
  });

  const cards = [
    { label: 'Colaboradores', valor: totalAtivos.toString(), cor: 'text-gray-900' },
    { label: 'Trabalhando Agora', valor: trabalhandoAgora.toString(), cor: 'text-emerald-600' },
    { label: 'Horas Extras (Mes)', valor: horasParaTexto(totalHE), cor: 'text-amber-600' },
    {
      label: 'Folha do Mes',
      valor: totalFolha.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      cor: 'text-gray-900',
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.cor}`}>{card.valor}</p>
          </div>
        ))}
      </div>

      {totalAtivos === 0 && (
        <div className="mt-6 p-8 text-center bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500 font-medium">Nenhum colaborador cadastrado ainda</p>
          <p className="text-sm text-gray-400 mt-1">A tela de cadastro de colaboradores vem no proximo passo</p>
        </div>
      )}
    </div>
  );
}