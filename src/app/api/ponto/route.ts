import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { formatTimeBR, formatDateISOBR, parseTime } from '@/lib/calculos/horas';
import type { RegistroPonto } from '@/types';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'colaborador') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { tipo } = body;

  const registrosRef = adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('registros');

  // ---------- Registro manual (data passada, entrada+saida informadas junto) ----------
  if (tipo === 'manual') {
    const { data, entrada, saida, motivo, intervaloNaoUsufruido } = body;

    if (!data || !entrada || !saida || !motivo?.trim()) {
      return NextResponse.json({ error: 'Preencha data, entrada, saida e motivo' }, { status: 400 });
    }

    const hojeBR = formatDateISOBR(new Date());
    if (data > hojeBR) {
      return NextResponse.json({ error: 'Nao e possivel registrar uma data futura' }, { status: 400 });
    }

    if (parseTime(saida) <= parseTime(entrada)) {
      return NextResponse.json({ error: 'Horario de saida deve ser depois da entrada' }, { status: 400 });
    }

    const existenteSnap = await registrosRef
      .where('colaboradorId', '==', user.uid)
      .where('data', '==', data)
      .limit(1)
      .get();

    if (!existenteSnap.empty) {
      return NextResponse.json({ error: 'Ja existe um registro para esta data' }, { status: 409 });
    }

    const docRef = registrosRef.doc();
    const novoRegistro: RegistroPonto = {
      id: docRef.id,
      empresaId: user.empresaId,
      colaboradorId: user.uid,
      data,
      entrada,
      saida,
      tipo: 'manual',
      motivo: motivo.trim(),
      criadoEm: new Date().toISOString(),
      intervaloNaoUsufruido: Boolean(intervaloNaoUsufruido),
    };

    await docRef.set(novoRegistro);
    return NextResponse.json({ id: docRef.id }, { status: 201 });
  }

  // ---------- Bater ponto automatico (entrada/saida de hoje) ----------
  if (tipo !== 'entrada' && tipo !== 'saida') {
    return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 });
  }

  const agora = new Date();
  const hoje = formatDateISOBR(agora);
  const horaAtual = formatTimeBR(agora);

  const hojeSnap = await registrosRef
    .where('colaboradorId', '==', user.uid)
    .where('data', '==', hoje)
    .limit(1)
    .get();

  if (tipo === 'entrada') {
    if (!hojeSnap.empty) {
      return NextResponse.json({ error: 'Voce ja registrou entrada hoje' }, { status: 409 });
    }

    const docRef = registrosRef.doc();
    const novoRegistro: RegistroPonto = {
      id: docRef.id,
      empresaId: user.empresaId,
      colaboradorId: user.uid,
      data: hoje,
      entrada: horaAtual,
      saida: null,
      tipo: 'automatico',
      motivo: null,
      criadoEm: agora.toISOString(),
    };

    await docRef.set(novoRegistro);
    return NextResponse.json({ id: docRef.id, entrada: horaAtual }, { status: 201 });
  }

  if (hojeSnap.empty) {
    return NextResponse.json({ error: 'Nenhuma entrada em aberto encontrada' }, { status: 409 });
  }

  const doc = hojeSnap.docs[0];
  const dados = doc.data() as RegistroPonto;

  if (dados.saida) {
    return NextResponse.json({ error: 'Jornada de hoje ja foi finalizada' }, { status: 409 });
  }

  const { intervaloNaoUsufruido } = body;
  await doc.ref.update({ saida: horaAtual, intervaloNaoUsufruido: Boolean(intervaloNaoUsufruido) });
  return NextResponse.json({ saida: horaAtual });
}