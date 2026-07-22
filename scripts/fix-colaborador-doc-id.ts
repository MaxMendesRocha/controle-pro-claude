import { adminAuth, adminDb } from '../src/lib/firebase/admin';

async function main() {
  const emailAlvo = 'laura@app.com'; // TROCAR
  const empresaId = '4a1181e6-a980-4047-be2b-2b918fb56d46'; // TROCAR (mesmo que usou no fix-claims.ts)

  const userRecord = await adminAuth.getUserByEmail(emailAlvo);
  const uidCorreto = userRecord.uid;
  console.log('UID correto (Auth):', uidCorreto);

  const colaboradoresRef = adminDb
    .collection('empresas').doc(empresaId)
    .collection('colaboradores');

  // Ja existe um documento no lugar certo?
  const docCorreto = await colaboradoresRef.doc(uidCorreto).get();
  if (docCorreto.exists) {
    console.log('Ja existe um documento em colaboradores/' + uidCorreto + ' - nada a fazer.');
    return;
  }

  // Procura o documento errado pelo campo email
  const snap = await colaboradoresRef.where('email', '==', emailAlvo).get();

  if (snap.empty) {
    console.error('Nenhum documento encontrado com email ' + emailAlvo + '. Confira o email ou o empresaId.');
    return;
  }

  if (snap.size > 1) {
    console.error('Mais de um documento encontrado com esse email - resolva manualmente para evitar duplicidade.');
    snap.docs.forEach((d) => console.log(' - doc id:', d.id, d.data()));
    return;
  }

  const docAntigo = snap.docs[0];
  const dadosAntigos = docAntigo.data();

  console.log('Documento errado encontrado, id atual:', docAntigo.id);
  console.log('Dados:', dadosAntigos);

  // Grava no lugar certo, corrigindo id/uid/empresaId/role
  await colaboradoresRef.doc(uidCorreto).set({
    ...dadosAntigos,
    id: uidCorreto,
    uid: uidCorreto,
    empresaId,
    role: 'colaborador',
  });

  // Remove o documento antigo (errado)
  await docAntigo.ref.delete();

  console.log('Migracao concluida: colaboradores/' + uidCorreto + ' criado, documento antigo (' + docAntigo.id + ') removido.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });