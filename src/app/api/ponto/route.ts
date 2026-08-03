import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { formatTimeBR, formatDateISOBR, parseTime } from '@/lib/calculos/horas';
import type { Colaborador, RegistroPonto } from '@/types';

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

  // ---------- Completar batidas de intervalo esquecidas (dia ja fechado) ----------
  if (tipo === 'completar-intervalo') {
    const { data, saidaIntervalo, voltaIntervalo, motivo } = body;

    if (!data || !saidaIntervalo || !voltaIntervalo || !motivo?.trim()) {
      return NextResponse.json(
        { error: 'Preencha data, saida do intervalo, volta do intervalo e justificativa' },
        { status: 400 }
      );
    }

    const snap = await registrosRef
      .where('colaboradorId', '==', user.uid)
      .where('data', '==', data)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Nenhum registro encontrado para esta data' }, { status: 404 });
    }

    const doc = snap.docs[0];
    const dados = doc.data() as RegistroPonto;

    if (!dados.entrada || !dados.saida) {
      return NextResponse.json(
        { error: 'So e possivel completar o intervalo de um dia com entrada e saida ja registradas' },
        { status: 400 }
      );
    }
    if (dados.saidaIntervalo || dados.voltaIntervalo) {
      return NextResponse.json({ error: 'Este registro ja tem batidas de intervalo' }, { status: 409 });
    }
    if (
      parseTime(saidaIntervalo) < parseTime(dados.entrada) ||
      parseTime(saidaIntervalo) >= parseTime(voltaIntervalo) ||
      parseTime(voltaIntervalo) > parseTime(dados.saida)
    ) {
      return NextResponse.json({ error: 'Horarios de intervalo invalidos para este dia' }, { status: 400 });
    }

    await doc.ref.update({
      saidaIntervalo,
      voltaIntervalo,
      motivo: motivo.trim(),
      editadoPor: user.uid,
      editadoEm: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  }

  // ---------- Bater ponto automatico (entrada/saida/intervalo de hoje) ----------
  if (tipo !== 'entrada' && tipo !== 'saida' && tipo !== 'saida-intervalo' && tipo !== 'volta-intervalo') {
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

  if (tipo === 'saida-intervalo' || tipo === 'volta-intervalo') {
    const colabDoc = await adminDb
      .collection('empresas').doc(user.empresaId)
      .collection('colaboradores').doc(user.uid)
      .get();
    const colaborador = colabDoc.data() as Colaborador | undefined;

    if (!colaborador?.intervaloManual) {
      return NextResponse.json({ error: 'Este colaborador nao usa batida manual de intervalo' }, { status: 400 });
    }

    if (tipo === 'saida-intervalo') {
      if (dados.saidaIntervalo) {
        return NextResponse.json({ error: 'Saida do intervalo ja registrada hoje' }, { status: 409 });
      }
      await doc.ref.update({ saidaIntervalo: horaAtual });
      return NextResponse.json({ saidaIntervalo: horaAtual });
    }

    // volta-intervalo
    if (!dados.saidaIntervalo) {
      return NextResponse.json({ error: 'Registre a saida do intervalo primeiro' }, { status: 409 });
    }
    if (dados.voltaIntervalo) {
      return NextResponse.json({ error: 'Volta do intervalo ja registrada hoje' }, { status: 409 });
    }
    await doc.ref.update({ voltaIntervalo: horaAtual });
    return NextResponse.json({ voltaIntervalo: horaAtual });
  }

  const { intervaloNaoUsufruido } = body;
  await doc.ref.update({ saida: horaAtual, intervaloNaoUsufruido: Boolean(intervaloNaoUsufruido) });
  return NextResponse.json({ saida: horaAtual });
}