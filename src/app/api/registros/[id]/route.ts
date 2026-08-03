// src/app/api/registros/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { parseTime } from '@/lib/calculos/horas';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { entrada, saida, motivo, intervaloNaoUsufruido, saidaIntervalo, voltaIntervalo } = body;

  if (!entrada || !saida || !motivo?.trim()) {
    return NextResponse.json({ error: 'Preencha entrada, saida e motivo' }, { status: 400 });
  }

  if (parseTime(saida) <= parseTime(entrada)) {
    return NextResponse.json({ error: 'Horario de saida deve ser depois da entrada' }, { status: 400 });
  }

  if (saidaIntervalo && voltaIntervalo) {
    if (
      parseTime(saidaIntervalo) < parseTime(entrada) ||
      parseTime(saidaIntervalo) >= parseTime(voltaIntervalo) ||
      parseTime(voltaIntervalo) > parseTime(saida)
    ) {
      return NextResponse.json({ error: 'Horarios de intervalo invalidos' }, { status: 400 });
    }
  } else if (saidaIntervalo || voltaIntervalo) {
    return NextResponse.json({ error: 'Preencha saida e volta do intervalo juntas, ou nenhuma das duas' }, { status: 400 });
  }

  const docRef = adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('registros').doc(id);

  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Registro nao encontrado' }, { status: 404 });
  }

  await docRef.update({
    entrada,
    saida,
    motivo: motivo.trim(),
    tipo: 'manual',
    editadoPor: user.uid,
    editadoEm: new Date().toISOString(),
    intervaloNaoUsufruido: Boolean(intervaloNaoUsufruido),
    saidaIntervalo: saidaIntervalo || null,
    voltaIntervalo: voltaIntervalo || null,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { id } = await params;

  const docRef = adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('registros').doc(id);

  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: 'Registro nao encontrado' }, { status: 404 });
  }

  await docRef.delete();
  return NextResponse.json({ ok: true });
}