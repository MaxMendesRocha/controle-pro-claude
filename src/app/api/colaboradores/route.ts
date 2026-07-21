// src/app/api/colaboradores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import type { Colaborador, DiaDaSemana } from '@/types';

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const snap = await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores')
    .get();

  const colaboradores = snap.docs.map((d) => d.data() as Colaborador);
  return NextResponse.json({ colaboradores });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== 'gestor') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const body = await request.json();
  const { nome, cpf, email, cargo, salarioBase, cargaHoraria, admissao, banco, diasTrabalho } = body;

  if (!nome || !cpf || !email || !cargo || !salarioBase || !cargaHoraria || !admissao) {
    return NextResponse.json({ error: 'Campos obrigatorios ausentes' }, { status: 400 });
  }

  if (typeof salarioBase !== 'number' || salarioBase <= 0) {
    return NextResponse.json({ error: 'Salario base invalido' }, { status: 400 });
  }
  if (typeof cargaHoraria !== 'number' || cargaHoraria <= 0 || cargaHoraria > 12) {
    return NextResponse.json({ error: 'Carga horaria invalida' }, { status: 400 });
  }

  let diasTrabalhoValidado: DiaDaSemana[] = [1, 2, 3, 4, 5]; // default: seg a sex
  if (diasTrabalho !== undefined) {
    if (
      !Array.isArray(diasTrabalho) ||
      diasTrabalho.length === 0 ||
      !diasTrabalho.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    ) {
      return NextResponse.json({ error: 'Dias de trabalho invalidos' }, { status: 400 });
    }
    diasTrabalhoValidado = diasTrabalho as DiaDaSemana[];
  }

  const senhaTemporaria = crypto.randomUUID();

  let uid: string;
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password: senhaTemporaria,
      displayName: nome,
    });
    uid = userRecord.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Ja existe uma conta com este e-mail' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro ao criar usuario' }, { status: 500 });
  }

  await adminAuth.setCustomUserClaims(uid, {
    role: 'colaborador',
    empresaId: user.empresaId,
  });

  const colaborador: Colaborador = {
    id: uid,
    empresaId: user.empresaId,
    uid,
    nome,
    cpf,
    email,
    cargo,
    salarioBase,
    cargaHoraria,
    diasTrabalho: diasTrabalhoValidado,
    admissao,
    banco: banco || '',
    ativo: true,
    role: 'colaborador',
    criadoEm: new Date().toISOString(),
  };

  await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores').doc(uid)
    .set(colaborador);

  try {
    const resetLink = await adminAuth.generatePasswordResetLink(email);
    console.log(`Link de definicao de senha para ${email}: ${resetLink}`);
  } catch {
    // nao bloqueia a criacao do colaborador se o link falhar
  }

  return NextResponse.json({ colaborador }, { status: 201 });
}