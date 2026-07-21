// src/app/api/colaboradores/[uid]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import type { DiaDaSemana } from '@/types';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { uid } = await params;
  const body = await request.json();

  if (typeof body.ativo !== 'boolean') {
    return NextResponse.json({ error: 'Campo ativo invalido' }, { status: 400 });
  }

  await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores').doc(uid)
    .update({ ativo: body.ativo });

  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { uid } = await params;
  const body = await request.json();
  const { nome, cargo, salarioBase, cargaHoraria, banco, diasTrabalho } = body;

  if (!nome?.trim() || !cargo?.trim()) {
    return NextResponse.json({ error: 'Nome e cargo sao obrigatorios' }, { status: 400 });
  }
  if (typeof salarioBase !== 'number' || salarioBase <= 0) {
    return NextResponse.json({ error: 'Salario base invalido' }, { status: 400 });
  }
  if (typeof cargaHoraria !== 'number' || cargaHoraria <= 0 || cargaHoraria > 12) {
    return NextResponse.json({ error: 'Carga horaria invalida' }, { status: 400 });
  }
  if (
    !Array.isArray(diasTrabalho) ||
    diasTrabalho.length === 0 ||
    !diasTrabalho.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  ) {
    return NextResponse.json({ error: 'Dias de trabalho invalidos' }, { status: 400 });
  }

  const docRef = adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores').doc(uid);

  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Colaborador nao encontrado' }, { status: 404 });
  }

  await docRef.update({
    nome: nome.trim(),
    cargo: cargo.trim(),
    salarioBase,
    cargaHoraria,
    banco: banco || '',
    diasTrabalho: diasTrabalho as DiaDaSemana[],
  });

  return NextResponse.json({ ok: true });
}