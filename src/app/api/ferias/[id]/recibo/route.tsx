// src/app/api/ferias/[id]/recibo/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { calcularPeriodosFerias } from '@/lib/calculos/ferias';
import type { Colaborador, GozoFerias } from '@/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: 700, backgroundColor: '#f3f4f6', padding: 6, marginBottom: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  infoCol: { width: '48%' },
  infoLabel: { color: '#666', marginBottom: 2 },
  infoValue: { fontWeight: 700 },
  linhaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#eee' },
  linhaLabel: {},
  linhaValor: { fontWeight: 700 },
  aviso: { fontSize: 9, color: '#b45309', backgroundColor: '#fffbeb', padding: 8, marginBottom: 10, borderRadius: 4 },
  liquidoBox: { backgroundColor: '#ecfdf5', padding: 12, marginTop: 10, alignItems: 'center', borderRadius: 4 },
  liquidoLabel: { color: '#666', marginBottom: 4 },
  liquidoValue: { fontSize: 20, fontWeight: 700, color: '#059669' },
  assinatura: { marginTop: 60, alignItems: 'center' },
  linhaAssinatura: { borderTopWidth: 1, borderTopColor: '#111', width: 260, marginBottom: 4 },
  footer: { marginTop: 16, fontSize: 8, color: '#999', textAlign: 'center' },
});

function currency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateBR(dataISO: string) {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function ReciboFeriasPDF({
  gozo,
  colaborador,
  empregador,
  aquisitivoInicio,
  aquisitivoFim,
}: {
  gozo: GozoFerias;
  colaborador: Colaborador;
  empregador: Colaborador;
  aquisitivoInicio: string;
  aquisitivoFim: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>RECIBO DE FERIAS</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMPREGADOR</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{empregador.nome}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CPF</Text>
              <Text style={styles.infoValue}>{empregador.cpf || 'Nao informado'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMPREGADO</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{colaborador.nome}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CPF</Text>
              <Text style={styles.infoValue}>{colaborador.cpf}</Text>
            </View>
          </View>
          <Text style={styles.infoLabel}>Data da Admissao: {formatDateBR(colaborador.admissao)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERIODOS</Text>
          <Text style={styles.infoLabel}>
            De Aquisicao: DE {formatDateBR(aquisitivoInicio)} A {formatDateBR(aquisitivoFim)}
          </Text>
          <Text style={styles.infoLabel}>
            De Gozo de Ferias: DE {formatDateBR(gozo.inicio)} A {formatDateBR(gozo.fim)} ({gozo.dias} dias)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASE DE CALCULO DA REMUNERACAO DAS FERIAS</Text>
          <Text style={styles.infoLabel}>Salario contratual: {currency(colaborador.salarioBase)}</Text>
        </View>

        {gozo.antecipada && (
          <Text style={styles.aviso}>
            Concessao antecipada: o periodo aquisitivo correspondente ainda nao havia completado 12 meses no momento da concessao.
          </Text>
        )}
        {gozo.pagamentoEmDobro && (
          <Text style={styles.aviso}>
            Pagamento em dobro (CLT Art. 137, Sumula 81 TST): o prazo do periodo concessivo ja havia vencido no momento da concessao.
          </Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROVENTOS</Text>
          <View style={styles.linhaRow}>
            <Text style={styles.linhaLabel}>Adiantamento de ferias</Text>
            <Text style={styles.linhaValor}>{currency(gozo.valorBase)}</Text>
          </View>
          <View style={styles.linhaRow}>
            <Text style={styles.linhaLabel}>Adiantamento do adicional de 1/3 sobre ferias</Text>
            <Text style={styles.linhaValor}>{currency(gozo.tercoConstitucional)}</Text>
          </View>
          <View style={[styles.linhaRow, { borderBottomWidth: 0, marginTop: 4 }]}>
            <Text style={[styles.linhaLabel, { fontWeight: 700 }]}>Total de Proventos</Text>
            <Text style={styles.linhaValor}>{currency(gozo.valorTotal)}</Text>
          </View>
        </View>

        <Text style={styles.aviso}>
          O INSS incidente sobre este valor e apurado e descontado na folha de pagamento do(s) mes(es) a que a ferias se refere, nao havendo retencao no momento deste adiantamento.
        </Text>

        <View style={styles.liquidoBox}>
          <Text style={styles.liquidoLabel}>Liquido a Receber</Text>
          <Text style={styles.liquidoValue}>{currency(gozo.valorTotal)}</Text>
        </View>

        <Text style={{ marginTop: 16 }}>
          Recebi do empregador acima identificado a quantia liquida de {currency(gozo.valorTotal)} por motivo de minhas ferias
          regulamentares, ora concedidas e que vou gozar de acordo com a descricao acima.
        </Text>

        <View style={styles.assinatura}>
          <View style={styles.linhaAssinatura} />
          <Text>Assinatura do trabalhador</Text>
        </View>

        <View style={styles.footer}>
          <Text>Emitido em {formatDateBR(new Date().toISOString().slice(0, 10))}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const { id } = await params;

  const empresaRef = adminDb.collection('empresas').doc(user.empresaId);
  const gozoDoc = await empresaRef.collection('feriasGozos').doc(id).get();

  if (!gozoDoc.exists) {
    return NextResponse.json({ error: 'Gozo de ferias nao encontrado' }, { status: 404 });
  }

  const gozo = gozoDoc.data() as GozoFerias;

  // colaborador so pode baixar o proprio recibo; gestor pode baixar qualquer um da empresa
  if (user.role === 'colaborador' && gozo.colaboradorId !== user.uid) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
  }

  const [colabDoc, empregadorDoc] = await Promise.all([
    empresaRef.collection('colaboradores').doc(gozo.colaboradorId).get(),
    empresaRef.collection('colaboradores').doc(gozo.registradoPor).get(),
  ]);

  if (!colabDoc.exists) {
    return NextResponse.json({ error: 'Colaborador nao encontrado' }, { status: 404 });
  }

  const colaborador = colabDoc.data() as Colaborador;
  const empregador = empregadorDoc.exists ? (empregadorDoc.data() as Colaborador) : colaborador;

  const periodos = calcularPeriodosFerias(colaborador.admissao);
  const periodo = periodos.find((p) => p.indice === gozo.periodoIndice);
  const aquisitivoInicio = periodo?.aquisitivoInicio ?? colaborador.admissao;
  const aquisitivoFim = periodo?.aquisitivoFim ?? colaborador.admissao;

  const pdfBuffer = await renderToBuffer(
    <ReciboFeriasPDF
      gozo={gozo}
      colaborador={colaborador}
      empregador={empregador}
      aquisitivoInicio={aquisitivoInicio}
      aquisitivoFim={aquisitivoFim}
    />
  );
  const pdfBytes = new Uint8Array(pdfBuffer);

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-ferias-${gozo.inicio}-${colaborador.nome.replace(/\s+/g, '-')}.pdf"`,
    },
  });
}
