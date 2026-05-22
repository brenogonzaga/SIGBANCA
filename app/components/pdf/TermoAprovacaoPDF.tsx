import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 40, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  mainTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 30, textAlign: 'center', textTransform: 'uppercase' },
  paragraph: { fontSize: 12, marginBottom: 20, lineHeight: 1.5, textAlign: 'justify' },
  centerText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
  signatureSection: { marginTop: 50, alignItems: 'center' },
  signatureBox: { width: '80%', alignItems: 'center', marginBottom: 30 },
  signatureLine: { width: '100%', borderBottomWidth: 1, marginBottom: 5 },
  signatureLabel: { fontSize: 11 },
  signatureSealContainer: { height: 30, justifyContent: 'flex-end', marginBottom: 2 },
  signatureSeal: { fontSize: 8, color: '#4B5563', textAlign: 'center' },
  signatureHash: { fontSize: 7, color: '#9CA3AF', textAlign: 'center' },
  bold: { fontWeight: 'bold' }
});

interface TermoAprovacaoProps {
  tituloTrabalho: string;
  alunoNome: string;
  dataAprovacao: string;
  orientadorNome: string;
  membro1Nome: string;
  membro2Nome: string;
  assinaturas: {
    orientador?: { hash: string, dataHora: string };
    membro1?: { hash: string, dataHora: string };
    membro2?: { hash: string, dataHora: string };
  }
}

export const TermoAprovacaoPDF = ({
  tituloTrabalho, alunoNome, dataAprovacao, orientadorNome, membro1Nome, membro2Nome, assinaturas
}: TermoAprovacaoProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>MINISTÉRIO DA EDUCAÇÃO</Text>
        <Text style={styles.title}>SECRETARIA DE EDUCAÇÃO PROFISSIONAL E TECNOLÓGICA</Text>
        <Text style={styles.title}>INSTITUTO FEDERAL DE EDUCAÇÃO, CIÊNCIA E TECNOLOGIA DO AMAZONAS</Text>
        <Text style={styles.title}>CAMPUS MANAUS-CENTRO</Text>
        <Text style={styles.title}>CURSO SUPERIOR DE TECNOLOGIA EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS</Text>
      </View>

      <Text style={styles.mainTitle}>TERMO DE APROVAÇÃO</Text>

      <Text style={styles.paragraph}>
        A monografia, que tem como título: <Text style={styles.bold}>{tituloTrabalho}</Text> foi submetida à defesa pública, sob a avaliação de banca examinadora, como parte dos requisitos necessários para a obtenção do título de graduação do curso superior de Tecnologia em Análise e Desenvolvimento de Sistemas.
      </Text>

      <Text style={styles.centerText}>AUTOR (A): {alunoNome.toUpperCase()}</Text>
      
      <Text style={styles.paragraph}>Monografia aprovada em: {dataAprovacao}</Text>

      <View style={styles.signatureSection}>
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
          <Text style={styles.signatureLabel}>Orientador (a): {orientadorNome}</Text>
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
          <Text style={styles.signatureLabel}>Primeiro (a) examinador (a): {membro1Nome}</Text>
        </View>

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
          <Text style={styles.signatureLabel}>Segundo (a) examinador (a): {membro2Nome}</Text>
        </View>
      </View>
    </Page>
  </Document>
);
