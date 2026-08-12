// src/app/api/ferias/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { calcularPeriodosFerias } from '@/lib/calculos/ferias';
import type { Colaborador, GozoFerias } from '@/types';

const DIAS_MINIMOS_POR_GOZO = 5; // CLT Art. 134 SS1 - nenhum periodo de fracionamento pode ser menor que isso

function diasEntre(inicio: string, fim: string): number {
  const inicioMs = new Date(inicio + 'T12:00:00').getTime();
  const fimMs = new Date(fim + 'T12:00:00').getTime();
  return Math.round((fimMs - inicioMs) / 86_400_000) + 1;
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { colaboradorId, periodoIndice, inicio, fim, observacao } = body;

  if (!colaboradorId || typeof colaboradorId !== 'string') {
    return NextResponse.json({ error: 'Colaborador invalido' }, { status: 400 });
  }
  if (!Number.isInteger(periodoIndice) || periodoIndice < 0) {
    return NextResponse.json({ error: 'Periodo invalido' }, { status: 400 });
  }
  if (!inicio || !fim || !/^\d{4}-\d{2}-\d{2}$/.test(inicio) || !/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
    return NextResponse.json({ error: 'Datas invalidas' }, { status: 400 });
  }
  if (fim < inicio) {
    return NextResponse.json({ error: 'A data de fim deve ser igual ou posterior a de inicio' }, { status: 400 });
  }

  const dias = diasEntre(inicio, fim);
  if (dias < DIAS_MINIMOS_POR_GOZO) {
    return NextResponse.json(
      { error: `O periodo minimo de gozo de ferias e de ${DIAS_MINIMOS_POR_GOZO} dias corridos` },
      { status: 400 }
    );
  }

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);

  const [colabDoc, gozosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').doc(colaboradorId).get(),
    empresaRef.collection('feriasGozos').where('colaboradorId', '==', colaboradorId).get(),
  ]);

  if (!colabDoc.exists) {
    return NextResponse.json({ error: 'Colaborador nao encontrado' }, { status: 404 });
  }
  const colaborador = colabDoc.data() as Colaborador;
  const gozosExistentes = gozosSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as GozoFerias);

  const sobreposto = gozosExistentes.some((g) => inicio <= g.fim && fim >= g.inicio);
  if (sobreposto) {
    return NextResponse.json({ error: 'Ja existe um gozo de ferias registrado nesse intervalo' }, { status: 409 });
  }

  const diasGozadosPorPeriodo: Record<number, number> = {};
  for (const g of gozosExistentes) {
    diasGozadosPorPeriodo[g.periodoIndice] = (diasGozadosPorPeriodo[g.periodoIndice] ?? 0) + g.dias;
  }

  const periodos = calcularPeriodosFerias(colaborador.admissao, undefined, { diasGozadosPorPeriodo });
  const periodo = periodos.find((p) => p.indice === periodoIndice);

  if (!periodo) {
    return NextResponse.json({ error: 'Periodo invalido para este colaborador' }, { status: 400 });
  }
  if (periodo.status === 'aquisitivo') {
    return NextResponse.json(
      { error: 'Este periodo aquisitivo ainda nao foi concluido - o direito as ferias ainda nao foi adquirido' },
      { status: 400 }
    );
  }
  if (dias > periodo.saldoDias) {
    return NextResponse.json(
      { error: `Saldo insuficiente neste periodo (disponivel: ${periodo.saldoDias} dia(s))` },
      { status: 400 }
    );
  }

  const docRef = empresaRef.collection('feriasGozos').doc();
  const gozo: GozoFerias = {
    id: docRef.id,
    empresaId: user.empresaId,
    colaboradorId,
    periodoIndice,
    inicio,
    fim,
    dias,
    ...(observacao?.trim() ? { observacao: observacao.trim() } : {}),
    registradoPor: user.uid,
    registradoEm: new Date().toISOString(),
  };

  await docRef.set(gozo);

  return NextResponse.json({ gozo }, { status: 201 });
}
