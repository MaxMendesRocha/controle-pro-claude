// src/app/api/regras/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import type { RegrasCalculo } from '@/types';

const DEFAULTS: Omit<RegrasCalculo, 'empresaId'> = {
  cargaDiaria: 8,
  cargaSemanal: 44,
  toleranciaMinutos: 10,
  heUtilPercent: 50,
  heDomingoFeriadoPercent: 100,
  limiteHEMensal: 40,
  descontoFaltaPercent: 100,
};

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const doc = await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('regras').doc('config')
    .get();

  if (!doc.exists) {
    return NextResponse.json({ regras: { empresaId: user.empresaId, ...DEFAULTS } });
  }

  return NextResponse.json({ regras: doc.data() as RegrasCalculo });
}

export async function PUT(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const body = await request.json();

  const campos: (keyof typeof DEFAULTS)[] = [
    'cargaDiaria',
    'cargaSemanal',
    'toleranciaMinutos',
    'heUtilPercent',
    'heDomingoFeriadoPercent',
    'limiteHEMensal',
    'descontoFaltaPercent',
  ];

  const regrasValidadas: Partial<Record<keyof typeof DEFAULTS, number>> = {};

  for (const campo of campos) {
    const valor = body[campo];
    if (typeof valor !== 'number' || Number.isNaN(valor) || valor < 0) {
      return NextResponse.json({ error: `Campo invalido: ${campo}` }, { status: 400 });
    }
    regrasValidadas[campo] = valor;
  }

  // Validacoes de faixa especificas
  if (regrasValidadas.cargaDiaria! > 12) {
    return NextResponse.json({ error: 'Carga diaria maxima permitida e 12h (limite legal com HE)' }, { status: 400 });
  }
  if (regrasValidadas.toleranciaMinutos! > 60) {
    return NextResponse.json({ error: 'Tolerancia de atraso parece alta demais - confira o valor' }, { status: 400 });
  }
  if (regrasValidadas.heUtilPercent! < 50) {
    return NextResponse.json({ error: 'Percentual de HE em dias uteis nao pode ser menor que 50% (minimo legal - CF art. 7, XVI)' }, { status: 400 });
  }
  if (regrasValidadas.heDomingoFeriadoPercent! < 100) {
    return NextResponse.json({ error: 'Percentual de HE em domingos/feriados nao pode ser menor que 100%' }, { status: 400 });
  }
  if (regrasValidadas.descontoFaltaPercent! > 100) {
    return NextResponse.json({ error: 'Desconto de falta nao pode passar de 100% do dia' }, { status: 400 });
  }

  const regras: RegrasCalculo = {
    empresaId: user.empresaId,
    cargaDiaria: regrasValidadas.cargaDiaria!,
    cargaSemanal: regrasValidadas.cargaSemanal!,
    toleranciaMinutos: regrasValidadas.toleranciaMinutos!,
    heUtilPercent: regrasValidadas.heUtilPercent!,
    heDomingoFeriadoPercent: regrasValidadas.heDomingoFeriadoPercent!,
    limiteHEMensal: regrasValidadas.limiteHEMensal!,
    descontoFaltaPercent: regrasValidadas.descontoFaltaPercent!,
  };

  await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('regras').doc('config')
    .set(regras);

  return NextResponse.json({ regras });
}
