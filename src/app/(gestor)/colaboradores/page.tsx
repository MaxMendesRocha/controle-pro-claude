import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import type { Colaborador } from '@/types';
import { FormNovoColaborador } from '@/components/colaboradores/FormNovoColaborador';
import { TabelaColaboradores } from '@/components/colaboradores/TabelaColaboradores';

export default async function ColaboradoresPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const snap = await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores')
    .get();

  const colaboradores = snap.docs
    .map((d) => d.data() as Colaborador)
    .filter((c) => c.role === 'colaborador'); // nao lista o proprio gestor na tabela

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Colaboradores</h2>
        <FormNovoColaborador />
      </div>

      <TabelaColaboradores colaboradores={colaboradores} />
    </div>
  );
}