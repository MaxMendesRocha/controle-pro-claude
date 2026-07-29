// src/app/api/perfil/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// So permite editar os proprios dados - uid sempre vem da sessao, nunca do
// body, entao nao ha como um usuario alterar o registro de outra pessoa.
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { nome, email, banco } = body;

  if (typeof nome !== 'string' || !nome.trim()) {
    return NextResponse.json({ error: 'Nome invalido' }, { status: 400 });
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: 'E-mail invalido' }, { status: 400 });
  }
  if (typeof banco !== 'string') {
    return NextResponse.json({ error: 'Campo banco invalido' }, { status: 400 });
  }

  const emailNormalizado = email.trim().toLowerCase();
  const emailAlterado = emailNormalizado !== (user.email ?? '').toLowerCase();

  // Atualiza o e-mail de login primeiro: se falhar (ex: ja em uso por outra
  // conta), nada mais e escrito - evita Firestore e Auth ficarem dessincronizados.
  if (emailAlterado) {
    try {
      await adminAuth.updateUser(user.uid, { email: emailNormalizado });
    } catch (err) {
      const code = (err as { code?: string }).code;
      const mensagem =
        code === 'auth/email-already-exists'
          ? 'Este e-mail ja esta em uso por outra conta'
          : 'Nao foi possivel atualizar o e-mail';
      return NextResponse.json({ error: mensagem }, { status: 400 });
    }
  }

  await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores').doc(user.uid)
    .update({ nome: nome.trim(), email: emailNormalizado, banco: banco.trim() });

  return NextResponse.json({ ok: true, emailAlterado });
}
