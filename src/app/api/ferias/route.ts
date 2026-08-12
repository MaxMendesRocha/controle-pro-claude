// src/app/api/ferias/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { calcularPeriodosFeriasCompleto, calcularValorFerias } from '@/lib/calculos/ferias';
import { DIAS_TRABALHO_PADRAO } from '@/lib/calculos/diasTrabalho';
import type { Colaborador, GozoFerias, RegistroPonto } from '@/types';

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
  const { colaboradorId, periodoIndice, inicio, fim, observacao, permitirAntecipacao } = body;

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

  const [colabDoc, gozosSnap, registrosSnap] = await Promise.all([
    empresaRef.collection('colaboradores').doc(colaboradorId).get(),
    empresaRef.collection('feriasGozos').where('colaboradorId', '==', colaboradorId).get(),
    empresaRef.collection('registros').where('colaboradorId', '==', colaboradorId).get(),
  ]);

  if (!colabDoc.exists) {
    return NextResponse.json({ error: 'Colaborador nao encontrado' }, { status: 404 });
  }
  const colaborador = colabDoc.data() as Colaborador;
  const gozosExistentes = gozosSnap.docs.map((d) => ({ ...d.data(), id: d.id }) as GozoFerias);
  const registros = registrosSnap.docs.map((d) => d.data() as RegistroPonto);

  const sobreposto = gozosExistentes.some((g) => inicio <= g.fim && fim >= g.inicio);
  if (sobreposto) {
    return NextResponse.json({ error: 'Ja existe um gozo de ferias registrado nesse intervalo' }, { status: 409 });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const diasTrabalho = colaborador.diasTrabalho?.length ? colaborador.diasTrabalho : DIAS_TRABALHO_PADRAO;
  const periodos = calcularPeriodosFeriasCompleto({ admissao: colaborador.admissao, diasTrabalho }, hoje, registros, gozosExistentes);
  const periodo = periodos.find((p) => p.indice === periodoIndice);

  if (!periodo) {
    return NextResponse.json({ error: 'Periodo invalido para este colaborador' }, { status: 400 });
  }
  const antecipada = periodo.status === 'aquisitivo';
  if (antecipada && !permitirAntecipacao) {
    return NextResponse.json(
      {
        error: 'Este periodo aquisitivo ainda nao foi concluido - o direito as ferias ainda nao foi adquirido',
        podeAntecipar: true,
      },
      { status: 400 }
    );
  }
  if (dias > periodo.saldoDias) {
    return NextResponse.json(
      { error: `Saldo insuficiente neste periodo (disponivel: ${periodo.saldoDias} dia(s))` },
      { status: 400 }
    );
  }

  const pagamentoEmDobro = periodo.status === 'vencido';
  const { valorBase, tercoConstitucional, valorTotal } = calcularValorFerias(
    colaborador.salarioBase,
    dias,
    pagamentoEmDobro
  );

  const docRef = empresaRef.collection('feriasGozos').doc();
  const gozo: GozoFerias = {
    id: docRef.id,
    empresaId: user.empresaId,
    colaboradorId,
    periodoIndice,
    inicio,
    fim,
    dias,
    valorBase,
    tercoConstitucional,
    valorTotal,
    pagamentoEmDobro,
    antecipada,
    ...(observacao?.trim() ? { observacao: observacao.trim() } : {}),
    registradoPor: user.uid,
    registradoEm: new Date().toISOString(),
  };

  await docRef.set(gozo);

  return NextResponse.json({ gozo }, { status: 201 });
}
