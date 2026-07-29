// src/components/perfil/PerfilContent.tsx
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { FormEditarPerfil } from './FormEditarPerfil';
import type { Colaborador } from '@/types';

const DIAS_LABEL: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sab' };

function formatDateBR(dataISO: string | undefined) {
  if (!dataISO) return 'Nao informado';
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
      <FormEditarPerfil nomeInicial={perfil.nome} emailInicial={perfil.email} bancoInicial={perfil.banco ?? ''} />

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-faint">Outras informacoes</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
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
              {(perfil.salarioBase ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-faint">Carga horaria</p>
            <p className="text-foreground">{perfil.cargaHoraria ? `${perfil.cargaHoraria}h/dia` : 'Nao informado'}</p>
          </div>
          <div>
            <p className="text-[11px] text-faint">Dias de trabalho</p>
            <p className="text-foreground">
              {(perfil.diasTrabalho ?? []).length > 0
                ? perfil.diasTrabalho.map((d) => DIAS_LABEL[d]).join(', ')
                : 'Nao informado'}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs text-faint">
          Cargo, salario e jornada sao gerenciados separadamente e nao podem ser editados por aqui.
        </p>
      </div>

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
