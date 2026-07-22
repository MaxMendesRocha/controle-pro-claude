// src/app/(gestor)/regras/page.tsx
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { RegrasForm } from '@/components/regras/RegrasForm';
import type { RegrasCalculo } from '@/types';

const DEFAULTS: Omit<RegrasCalculo, 'empresaId'> = {
  cargaDiaria: 8,
  cargaSemanal: 44,
  toleranciaMinutos: 10,
  heUtilPercent: 50,
  heDomingoFeriadoPercent: 100,
  limiteHEMensal: 40,
  descontoFaltaPercent: 100,
  diaFechamento: 0,
};

export default async function RegrasPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const doc = await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('regras').doc('config')
    .get();

  const dados = doc.exists ? (doc.data() as RegrasCalculo) : null;
  const regras: RegrasCalculo = dados
    ? { ...dados, diaFechamento: dados.diaFechamento ?? 0 }
    : { empresaId: user.empresaId, ...DEFAULTS };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Regras de Calculo</h2>
      <RegrasForm regrasIniciais={regras} />
    </div>
  );
}