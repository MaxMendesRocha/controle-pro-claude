// src/components/perfil/PerfilContent.tsx
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { FormEditarBanco } from './FormEditarBanco';
import type { Colaborador } from '@/types';

const DIAS_LABEL: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' };

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

export async function PerfilContent() {
  const user = await getSessionUser();
  if (!user) return null;

  const doc = await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores').doc(user.uid)
    .get();

  const perfil = doc.data() as Colaborador | undefined;

  if (!perfil) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-faint">
        Nao foi possivel carregar seu perfil.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Dados pessoais</p>
        <p className="text-lg font-bold text-foreground">{perfil.nome}</p>
        <p className="text-sm text-muted">{perfil.email}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-faint">Cargo</p>
            <p className="text-foreground">{perfil.cargo}</p>
          </div>
          <div>
            <p className="text-[11px] text-faint">Admissao</p>
            <p className="text-foreground">{formatDateBR(perfil.admissao)}</p>
          </div>
          <div>
            <p className="text-[11px] text-faint">CPF</p>
            <p className="text-foreground">{perfil.cpf || 'Nao informado'}</p>
          </div>
          <div>
            <p className="text-[11px] text-faint">Salario base</p>
            <p className="text-foreground">
              {perfil.salarioBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-faint">Carga horaria</p>
            <p className="text-foreground">{perfil.cargaHoraria}h/dia</p>
          </div>
          <div>
            <p className="text-[11px] text-faint">Dias de trabalho</p>
            <p className="text-foreground">{perfil.diasTrabalho.map((d) => DIAS_LABEL[d]).join(', ')}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-faint">
          Nome, cargo, salario e jornada sao definidos pelo gestor da empresa.
        </p>
      </div>

      <FormEditarBanco bancoInicial={perfil.banco ?? ''} />

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-1 text-sm font-medium text-foreground">Senha</p>
        <p className="mb-3 text-sm text-muted">
          Para trocar sua senha, enviamos um link de redefinicao para o seu e-mail cadastrado.
        </p>
        <Link href="/esqueci-senha" className="text-sm font-medium text-accent hover:text-accent-ink">
          Alterar senha
        </Link>
      </div>
    </div>
  );
}
