import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  subtitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 20 },
  paragraph: { fontSize: 11, marginBottom: 10, lineHeight: 1.5, textAlign: 'justify' },
  table: { display: 'flex', flexDirection: 'column', width: '100%', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 15, marginTop: 15 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '20%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f0f0', padding: 5, textAlign: 'center' },
  tableCol: { width: '20%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5, textAlign: 'center' },
  tableCellHeader: { fontSize: 10, fontWeight: 'bold' },
  tableCell: { fontSize: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 20, marginBottom: 10, textAlign: 'center' },
  alteracoesBox: { borderStyle: 'solid', borderWidth: 1, padding: 10, minHeight: 100, marginBottom: 30 },
  signatureSection: { marginTop: 30 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  signatureBox: { width: '45%', alignItems: 'center' },
  signatureLine: { width: '100%', borderBottomWidth: 1, marginBottom: 5 },
  signatureLabel: { fontSize: 10, fontWeight: 'bold' },
  signatureSealContainer: { height: 30, justifyContent: 'flex-end', marginBottom: 2 },
  signatureSeal: { fontSize: 8, color: '#4B5563', textAlign: 'center' },
  signatureHash: { fontSize: 7, color: '#9CA3AF', textAlign: 'center' },
  bold: { fontWeight: 'bold' }
});

interface FichaGeralProps {
  data: string;
  hora: string;
  alunoNome: string;
  tituloTrabalho: string;
  orientadorNome: string;
  membro1Nome: string;
  membro2Nome: string;
  notas: {
    orientador: { escrito: number, oral: number, software: number, final: number };
    membro1: { escrito: number, oral: number, software: number, final: number };
    membro2: { escrito: number, oral: number, software: number, final: number };
  };
  mediaFinal: number;
  alteracoesPropostas: string;
  assinaturas: {
    orientador?: { hash: string, dataHora: string };
    membro1?: { hash: string, dataHora: string };
    membro2?: { hash: string, dataHora: string };
    aluno?: { hash: string, dataHora: string };
  }
}

export const FichaGeralPDF = ({
  data, hora, alunoNome, tituloTrabalho, orientadorNome, membro1Nome, membro2Nome, notas, mediaFinal, alteracoesPropostas, assinaturas
}: FichaGeralProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>MINISTÉRIO DA EDUCAÇÃO</Text>
        <Text style={styles.subtitle}>FICHA DE AVALIAÇÃO DO TRABALHO DE CONCLUSÃO DE CURSO</Text>
      </View>

      <Text style={styles.paragraph}>
        Ao {data}, às {hora}, o (a) estudante <Text style={styles.bold}>{alunoNome}</Text> apresentou o seu Trabalho de Conclusão de Curso (TCC2) para avaliação da Banca Examinadora constituída pelos seguintes integrantes: Prof. {orientadorNome} (orientador), Prof. {membro1Nome} (Membro 1) e Prof. {membro2Nome} (Membro 2). A sessão pública de defesa foi aberta pelo(a) Presidente da Banca, fazendo referência ao TCC com o título <Text style={styles.bold}>{tituloTrabalho}</Text>. Após a defesa e arguições, a Banca deliberou suas notas, conforme quadro:
      </Text>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Itens avaliados</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Orientador(a)</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Membro 1</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Membro 2</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Trabalho escrito (0 a 6)</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.orientador.escrito.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro1.escrito.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro2.escrito.toFixed(1)}</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Apresentação oral (0 a 4)</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.orientador.oral.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro1.oral.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro2.oral.toFixed(1)}</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Implementação (0 a 10)</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.orientador.software.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro1.software.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro2.software.toFixed(1)}</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Nota final (0 a 10)</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.orientador.final.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro1.final.toFixed(1)}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{notas.membro2.final.toFixed(1)}</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Média Final</Text></View>
          <View style={{...styles.tableCol, width: '60%'}}><Text style={{...styles.tableCellHeader, fontSize: 12}}>{mediaFinal.toFixed(2)}</Text></View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>ALTERAÇÕES PROPOSTAS PELA BANCA</Text>
      <View style={styles.alteracoesBox}>
        <Text style={styles.paragraph}>{alteracoesPropostas || "Nenhuma alteração proposta."}</Text>
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureSealContainer}>
              {assinaturas.orientador ? (
                <View>
                  <Text style={styles.signatureSeal}>Assinado eletronicamente em {assinaturas.orientador.dataHora}</Text>
                  <Text style={styles.signatureHash}>Hash: {assinaturas.orientador.hash}</Text>
                </View>
              ) : <Text style={[styles.signatureSeal, { fontStyle: 'italic' }]}>Pendente</Text>}
            </View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Presidente: {orientadorNome}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureSealContainer}>
              {assinaturas.membro1 ? (
                <View>
                  <Text style={styles.signatureSeal}>Assinado eletronicamente em {assinaturas.membro1.dataHora}</Text>
                  <Text style={styles.signatureHash}>Hash: {assinaturas.membro1.hash}</Text>
                </View>
              ) : <Text style={[styles.signatureSeal, { fontStyle: 'italic' }]}>Pendente</Text>}
            </View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Avaliador 1: {membro1Nome}</Text>
          </View>
        </View>
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureSealContainer}>
              {assinaturas.membro2 ? (
                <View>
                  <Text style={styles.signatureSeal}>Assinado eletronicamente em {assinaturas.membro2.dataHora}</Text>
                  <Text style={styles.signatureHash}>Hash: {assinaturas.membro2.hash}</Text>
                </View>
              ) : <Text style={[styles.signatureSeal, { fontStyle: 'italic' }]}>Pendente</Text>}
            </View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Avaliador 2: {membro2Nome}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureSealContainer}>
              {assinaturas.aluno ? (
                <View>
                  <Text style={styles.signatureSeal}>Assinado eletronicamente em {assinaturas.aluno.dataHora}</Text>
                  <Text style={styles.signatureHash}>Hash: {assinaturas.aluno.hash}</Text>
                </View>
              ) : <Text style={[styles.signatureSeal, { fontStyle: 'italic' }]}>Pendente</Text>}
            </View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Acadêmico: {alunoNome}</Text>
          </View>
        </View>
      </View>

    </Page>
  </Document>
);
