// src/app/api/holerites/[docId]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { horasParaTexto } from '@/lib/calculos/horas';
import type { Colaborador, Holerite } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 9, color: '#666' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  infoCol: { width: '48%' },
  infoLabel: { color: '#666', marginBottom: 2 },
  infoValue: { fontWeight: 700, marginBottom: 4 },
  table: { marginBottom: 16 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#111', paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 4 },
  colDescricao: { width: '40%' },
  colReferencia: { width: '20%', textAlign: 'right' },
  colVencimento: { width: '20%', textAlign: 'right' },
  colDesconto: { width: '20%', textAlign: 'right' },
  headerCell: { fontWeight: 700 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 2, borderTopColor: '#111', paddingTop: 10, marginTop: 4 },
  totalsLabel: { color: '#666', marginBottom: 2 },
  totalsValue: { fontSize: 12, fontWeight: 700 },
  liquidoBox: { backgroundColor: '#ecfdf5', padding: 12, marginTop: 16, alignItems: 'center', borderRadius: 4 },
  liquidoLabel: { color: '#666', marginBottom: 4 },
  liquidoValue: { fontSize: 20, fontWeight: 700, color: '#059669' },
  footer: { marginTop: 20, fontSize: 8, color: '#999', textAlign: 'center' },
});

function currency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function HoleritePDF({ holerite, colaborador }: { holerite: Holerite; colaborador: Colaborador }) {
  const totalHE = holerite.totalHorasExtras + holerite.totalHorasExtrasDomingoFeriado;
  const totalVencimentos = holerite.salarioBase + holerite.valorHorasExtras;
  const totalDescontos = holerite.inss + holerite.descontoFaltas;
  const temSeparacao = holerite.valorHorasExtras50 !== undefined && holerite.valorHorasExtras100 !== undefined;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>RECIBO DE PAGAMENTO</Text>
          <Text style={styles.subtitle}>Referencia: {holerite.mes}</Text>
          {holerite.periodoInicio && holerite.periodoFim && (
            <Text style={styles.subtitle}>Periodo: {formatDateBR(holerite.periodoInicio)} a {formatDateBR(holerite.periodoFim)}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Colaborador</Text>
            <Text style={styles.infoValue}>{colaborador.nome}</Text>
            <Text style={styles.infoLabel}>Cargo: {colaborador.cargo}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Admissao</Text>
            <Text style={styles.infoValue}>{formatDateBR(colaborador.admissao)}</Text>
            <Text style={styles.infoLabel}>Banco: {colaborador.banco || 'Nao informado'}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescricao, styles.headerCell]}>Descricao</Text>
            <Text style={[styles.colReferencia, styles.headerCell]}>Referencia</Text>
            <Text style={[styles.colVencimento, styles.headerCell]}>Vencimentos</Text>
            <Text style={[styles.colDesconto, styles.headerCell]}>Descontos</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.colDescricao}>Salario Base</Text>
            <Text style={styles.colReferencia}>{holerite.divisorMensal ? `${holerite.divisorMensal.toFixed(2).replace('.', ',')}h` : '220,00h'}</Text>
            <Text style={styles.colVencimento}>{currency(holerite.salarioBase)}</Text>
            <Text style={styles.colDesconto}>-</Text>
          </View>

          {temSeparacao ? (
            <>
              {holerite.totalHorasExtras > 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.colDescricao}>Horas Extras 50%</Text>
                  <Text style={styles.colReferencia}>{horasParaTexto(holerite.totalHorasExtras)}</Text>
                  <Text style={styles.colVencimento}>{currency(holerite.valorHorasExtras50)}</Text>
                  <Text style={styles.colDesconto}>-</Text>
                </View>
              )}
              {holerite.totalHorasExtrasDomingoFeriado > 0 && (
                <View style={styles.tableRow}>
                  <Text style={styles.colDescricao}>Horas Extras 100%</Text>
                  <Text style={styles.colReferencia}>{horasParaTexto(holerite.totalHorasExtrasDomingoFeriado)}</Text>
                  <Text style={styles.colVencimento}>{currency(holerite.valorHorasExtras100)}</Text>
                  <Text style={styles.colDesconto}>-</Text>
                </View>
              )}
            </>
          ) : (
            holerite.valorHorasExtras > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.colDescricao}>Horas Extras</Text>
                <Text style={styles.colReferencia}>{horasParaTexto(totalHE)}</Text>
                <Text style={styles.colVencimento}>{currency(holerite.valorHorasExtras)}</Text>
                <Text style={styles.colDesconto}>-</Text>
              </View>
            )
          )}

          {holerite.descontoFaltas > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.colDescricao}>Desconto de Faltas</Text>
              <Text style={styles.colReferencia}>-</Text>
              <Text style={styles.colVencimento}>-</Text>
              <Text style={styles.colDesconto}>{currency(holerite.descontoFaltas)}</Text>
            </View>
          )}

          <View style={styles.tableRow}>
            <Text style={styles.colDescricao}>INSS</Text>
            <Text style={styles.colReferencia}>-</Text>
            <Text style={styles.colVencimento}>-</Text>
            <Text style={styles.colDesconto}>{currency(holerite.inss)}</Text>
          </View>
        </View>

        <View style={styles.totalsRow}>
          <View>
            <Text style={styles.totalsLabel}>Total de Vencimentos</Text>
            <Text style={styles.totalsValue}>{currency(totalVencimentos)}</Text>
          </View>
          <View>
            <Text style={styles.totalsLabel}>Total de Descontos</Text>
            <Text style={styles.totalsValue}>{currency(totalDescontos)}</Text>
          </View>
        </View>

        <View style={styles.liquidoBox}>
          <Text style={styles.liquidoLabel}>Valor Liquido a Receber</Text>
          <Text style={styles.liquidoValue}>{currency(holerite.liquido)}</Text>
        </View>

        <View style={styles.footer}>
          <Text>
            Dias trabalhados: {holerite.diasTrabalhados} | Carga horaria: {colaborador.cargaHoraria}h/dia
          </Text>
          <Text>FGTS do periodo (informativo, pago pelo empregador): {currency(holerite.fgts)}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { docId } = await params;

  const holeriteDoc = await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('holerites').doc(docId)
    .get();

  if (!holeriteDoc.exists) {
    return NextResponse.json({ error: 'Holerite nao encontrado' }, { status: 404 });
  }

  const holerite = holeriteDoc.data() as Holerite;

  // colaborador so pode baixar o proprio holerite; gestor pode baixar qualquer um da empresa
  if (user.role === 'colaborador' && holerite.colaboradorId !== user.uid) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const colabDoc = await adminDb
    .collection('empresas').doc(user.empresaId)
    .collection('colaboradores').doc(holerite.colaboradorId)
    .get();

  if (!colabDoc.exists) {
    return NextResponse.json({ error: 'Colaborador nao encontrado' }, { status: 404 });
  }

  const colaborador = colabDoc.data() as Colaborador;

  const pdfBuffer = await renderToBuffer(<HoleritePDF holerite={holerite} colaborador={colaborador} />);
  const pdfBytes = new Uint8Array(pdfBuffer);

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="holerite-${holerite.mes}-${colaborador.nome.replace(/\s+/g, '-')}.pdf"`,
    },
  });
}