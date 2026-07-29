// src/app/api/perfil/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

// So permite editar os proprios dados bancarios - uid sempre vem da sessao,
// nunca do body, entao nao ha como um usuario alterar o registro de outro.
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const { banco } = body;

  if (typeof banco !== 'string') {
    return NextResponse.json({ error: 'Campo banco invalido' }, { status: 400 });
  }

  await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores').doc(user.uid)
    .update({ banco: banco.trim() });

  return NextResponse.json({ ok: true });
}
