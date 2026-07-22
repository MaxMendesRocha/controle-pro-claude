// src/app/api/holerites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { calcularHolerite } from '@/lib/calculos/holerite';
import { calcularPeriodo } from '@/lib/calculos/periodo';
import type { Colaborador, RegistroPonto, RegrasCalculo, Holerite } from '@/types';

const DEFAULTS_REGRAS: Omit<RegrasCalculo, 'empresaId'> = {
  cargaDiaria: 8,
  cargaSemanal: 44,
  toleranciaMinutos: 10,
  heUtilPercent: 50,
  heDomingoFeriadoPercent: 100,
  limiteHEMensal: 40,
  descontoFaltaPercent: 100,
  diaFechamento: 0,
};

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes');
  const colaboradorId = searchParams.get('colaboradorId');

  let query: FirebaseFirestore.Query = adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('holerites');

  if (mes) query = query.where('mes', '==', mes);
  if (colaboradorId) query = query.where('colaboradorId', '==', colaboradorId);

  const snap = await query.get();
  const holerites = snap.docs.map((d) => d.data() as Holerite);

  return NextResponse.json({ holerites });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { mes } = await request.json();
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: 'Mes invalido (formato esperado: YYYY-MM)' }, { status: 400 });
  }

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colaboradoresSnap, regrasDoc, registrosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').get(),
    empresaRef.collection('regras').doc('config').get(),
    empresaRef.collection('registros').get(),
  ]);

  const colaboradores = colaboradoresSnap.docs
    .map((d) => d.data() as Colaborador)
    .filter((c) => c.role === 'colaborador' && c.ativo);

  const regras: RegrasCalculo = regrasDoc.exists
    ? (regrasDoc.data() as RegrasCalculo)
    : { empresaId: user.empresaId, ...DEFAULTS_REGRAS };

  const periodo = calcularPeriodo(mes, regras.diaFechamento);

  const todosRegistros = registrosSnap.docs.map((d) => d.data() as RegistroPonto);

  if (colaboradores.length === 0) {
    return NextResponse.json({ error: 'Nenhum colaborador ativo encontrado' }, { status: 400 });
  }

  const resultados: { colaboradorId: string; nome: string; avisos: string[] }[] = [];
  const batch = adminDb.batch();

  for (const colaborador of colaboradores) {
    const registrosDoPeriodo = todosRegistros.filter(
      (r) =>
        r.colaboradorId === colaborador.uid &&
        r.data >= periodo.inicio &&
        r.data <= periodo.fim
    );

    const { holerite, avisos } = calcularHolerite(colaborador, registrosDoPeriodo, regras, mes, periodo);

    const docId = `${mes}_${colaborador.uid}`;
    const docRef = empresaRef.collection('holerites').doc(docId);
    const holeriteCompleto: Holerite = { id: docId, ...holerite };

    batch.set(docRef, holeriteCompleto);
    resultados.push({ colaboradorId: colaborador.uid, nome: colaborador.nome, avisos });
  }

  await batch.commit();

  return NextResponse.json({ ok: true, mes, periodo, resultados }, { status: 201 });
}