import { adminAuth, adminDb } from '../src/lib/firebase/admin';

async function main() {
  const emailAlvo = 'laura@app.com'; // TROCAR
  const roleAlvo: 'gestor' | 'colaborador' = 'colaborador'; // TROCAR se for gestor
  const empresaId = '4a1181e6-a980-4047-be2b-2b918fb56d46'; // TROCAR - veja abaixo como encontrar

  const userRecord = await adminAuth.getUserByEmail(emailAlvo);
  console.log('Usuario encontrado no Auth:', userRecord.uid, userRecord.email);

  // Confirma que existe um documento de colaborador correspondente nesta empresa
  const colabDoc = await adminDb
    .collection('empresas').doc(empresaId)
    .collection('colaboradores').doc(userRecord.uid)
    .get();

  if (!colabDoc.exists) {
    console.warn(
      'ATENCAO: nao existe documento em empresas/' + empresaId + '/colaboradores/' + userRecord.uid
    );
    console.warn('Confira se o empresaId esta correto, ou se o campo uid do documento no Firestore bate com o uid acima.');
  } else {
    console.log('Documento do colaborador encontrado:', colabDoc.data()?.nome);
  }

  await adminAuth.setCustomUserClaims(userRecord.uid, {
    role: roleAlvo,
    empresaId,
  });

  console.log('Custom claims restaurados com sucesso.');
  console.log('O usuario precisa fazer LOGOUT e LOGIN de novo para o navegador pegar o token atualizado.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });