// src/app/api/ferias/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { id } = await params;

  const docRef = adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('feriasGozos').doc(id);

  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Gozo de ferias nao encontrado' }, { status: 404 });
  }

  await docRef.delete();
  return NextResponse.json({ ok: true });
}
