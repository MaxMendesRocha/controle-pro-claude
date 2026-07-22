import { adminDb } from '../src/lib/firebase/admin';

async function main() {
  const empresaId = '4a1181e6-a980-4047-be2b-2b918fb56d46'; // TROCAR (mesmo de sempre)
  const idAntigo = '3yHszIw01JWX37yiwHPrkZLJJoQ2'; // TROCAR - o colaboradorId errado usado nos registros (ex: 3yHszIw01JWX37yiwHPrkZLJJoQ2)
  const idCorreto = 'ASV0sQ5Z3YcC0uXId6L9Ygl2ku33'; // TROCAR - o UID real do Auth (ex: ASV0sQ5Z3YcC0uXId6L9Ygl2ku33)

  const registrosRef = adminDb
    .collection('empresas').doc(empresaId)
    .collection('registros');

  const snap = await registrosRef.where('colaboradorId', '==', idAntigo).get();

  if (snap.empty) {
    console.log('Nenhum registro encontrado com colaboradorId = ' + idAntigo);
    return;
  }

  console.log(`Encontrados ${snap.size} registro(s) para corrigir:`);
  snap.docs.forEach((d) => console.log(' - ' + d.id + ' | data: ' + d.data().data));

  const batch = adminDb.batch();
  snap.docs.forEach((d) => {
    batch.update(d.ref, { colaboradorId: idCorreto });
  });

  await batch.commit();

  console.log(`${snap.size} registro(s) atualizado(s) para colaboradorId = ${idCorreto}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });