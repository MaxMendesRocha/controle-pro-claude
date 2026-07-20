import { adminAuth, adminDb } from '../src/lib/firebase/admin';
import { randomUUID } from 'crypto';

async function main() {
  const empresaId = randomUUID();
  const gestorEmail = 'maxmendes@outlook.com'; // TROCAR
  const gestorSenha = '12345678'; // TROCAR
  const gestorNome = 'Max Emiliano Mendes'; // TROCAR

  await adminDb.collection('empresas').doc(empresaId).set({
    razaoSocial: 'Empresa PontoPro LTDA', // TROCAR
    cnpj: '00.000.000/0001-00', // TROCAR
    criadaEm: new Date().toISOString(),
  });

  const userRecord = await adminAuth.createUser({
    email: gestorEmail,
    password: gestorSenha,
    displayName: gestorNome,
  });

  await adminAuth.setCustomUserClaims(userRecord.uid, {
    role: 'gestor',
    empresaId,
  });

  await adminDb
    .collection('empresas').doc(empresaId)
    .collection('colaboradores').doc(userRecord.uid)
    .set({
      empresaId,
      uid: userRecord.uid,
      nome: gestorNome,
      cpf: '',
      email: gestorEmail,
      cargo: 'Gestor',
      salarioBase: 0,
      cargaHoraria: 8,
      admissao: new Date().toISOString().slice(0, 10),
      banco: '',
      ativo: true,
      role: 'gestor',
      criadoEm: new Date().toISOString(),
    });

  await adminDb
    .collection('empresas').doc(empresaId)
    .collection('regras').doc('config')
    .set({
      empresaId,
      cargaDiaria: 8,
      cargaSemanal: 44,
      toleranciaMinutos: 10,
      heUtilPercent: 50,
      heDomingoFeriadoPercent: 100,
      limiteHEMensal: 40,
      descontoFaltaPercent: 100,
    });

  console.log('Empresa criada:', empresaId);
  console.log('Gestor criado:', userRecord.uid, gestorEmail);
  console.log('Troque a senha temporaria no primeiro login.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro no seed:', err);
    process.exit(1);
  });