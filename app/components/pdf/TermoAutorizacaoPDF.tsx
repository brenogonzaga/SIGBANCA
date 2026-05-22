import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, textAlign: 'center' },
  title: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  mainTitle: { fontSize: 14, fontWeight: 'bold', marginVertical: 20, textAlign: 'center', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { fontSize: 10, fontWeight: 'bold', marginRight: 5 },
  value: { fontSize: 10, flex: 1, borderBottomWidth: 1, borderBottomColor: '#000' },
  paragraph: { fontSize: 9, marginTop: 20, marginBottom: 20, lineHeight: 1.5, textAlign: 'justify' },
  checkboxRow: { flexDirection: 'row', marginBottom: 5, alignItems: 'center' },
  checkboxLabel: { fontSize: 10, width: '60%' },
  checkboxOption: { fontSize: 10, marginRight: 20 },
  signatureSection: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: '45%', alignItems: 'center' },
  signatureLine: { width: '100%', borderBottomWidth: 1, marginBottom: 5 },
  signatureLabel: { fontSize: 10 },
  signatureSealContainer: { height: 30, justifyContent: 'flex-end', marginBottom: 2 },
  signatureSeal: { fontSize: 8, color: '#4B5563', textAlign: 'center' },
  signatureHash: { fontSize: 7, color: '#9CA3AF', textAlign: 'center' },
  dateLocationRow: { marginTop: 30, flexDirection: 'row' },
});

interface TermoAutorizacaoProps {
  tituloTrabalho: string;
  aluno: {
    nome: string;
    rg: string;
    cpf: string;
    email: string;
  };
  orientador: {
    nome: string;
    cpf: string;
  };
  curso: string;
  areaConhecimento: string;
  opcoes: {
    confidencial: boolean;
    geraPatente: boolean;
    liberadoReprod: boolean;
  };
  data: string;
  local: string;
  assinaturas: {
    aluno?: { hash: string, dataHora: string };
    orientador?: { hash: string, dataHora: string };
  }
}

export const TermoAutorizacaoPDF = ({
  tituloTrabalho, aluno, orientador, curso, areaConhecimento, opcoes, data, local, assinaturas
}: TermoAutorizacaoProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>MINISTÉRIO DA EDUCAÇÃO</Text>
        <Text style={styles.title}>SECRETARIA DE EDUCAÇÃO PROFISSIONAL E TECNOLÓGICA</Text>
        <Text style={styles.title}>INSTITUTO FEDERAL DO AMAZONAS - CAMPUS MANAUS-CENTRO</Text>
      </View>

      <Text style={styles.mainTitle}>TERMO DE AUTORIZAÇÃO PARA PUBLICAÇÃO DIGITAL</Text>

      <Text style={styles.sectionTitle}>1. IDENTIFICAÇÃO DO MATERIAL BIBLIOGRÁFICO:</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{tituloTrabalho}</Text>
      </View>

      <Text style={styles.sectionTitle}>2. IDENTIFICAÇÃO DO AUTOR</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Nome:</Text>
        <Text style={styles.value}>{aluno.nome}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>RG:</Text>
        <Text style={{...styles.value, flex: 0.3}}>{aluno.rg}</Text>
        <Text style={{...styles.label, marginLeft: 10}}>CPF:</Text>
        <Text style={{...styles.value, flex: 0.3}}>{aluno.cpf}</Text>
        <Text style={{...styles.label, marginLeft: 10}}>E-Mail:</Text>
        <Text style={styles.value}>{aluno.email}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Orientador:</Text>
        <Text style={{...styles.value, flex: 0.7}}>{orientador.nome}</Text>
        <Text style={{...styles.label, marginLeft: 10}}>CPF:</Text>
        <Text style={styles.value}>{orientador.cpf}</Text>
      </View>

      <Text style={styles.sectionTitle}>3. IDENTIFICAÇÃO DO DOCUMENTO</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Curso:</Text>
        <Text style={styles.value}>{curso}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Área de Conhecimento ou Eixo Tecnológico:</Text>
        <Text style={styles.value}>{areaConhecimento}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Título:</Text>
        <Text style={styles.value}>{tituloTrabalho}</Text>
      </View>

      <Text style={styles.sectionTitle}>4. INFORMAÇÕES DE ACESSO AO DOCUMENTO</Text>
      <View style={styles.checkboxRow}>
        <Text style={styles.checkboxLabel}>Este documento é confidencial?</Text>
        <Text style={styles.checkboxOption}>( {opcoes.confidencial ? 'X' : ' '} ) Sim</Text>
        <Text style={styles.checkboxOption}>( {!opcoes.confidencial ? 'X' : ' '} ) Não</Text>
      </View>
      <View style={styles.checkboxRow}>
        <Text style={styles.checkboxLabel}>Este trabalho ocasionará registro de patente?</Text>
        <Text style={styles.checkboxOption}>( {opcoes.geraPatente ? 'X' : ' '} ) Sim</Text>
        <Text style={styles.checkboxOption}>( {!opcoes.geraPatente ? 'X' : ' '} ) Não</Text>
      </View>
      <View style={styles.checkboxRow}>
        <Text style={styles.checkboxLabel}>Este trabalho pode ser liberado para reprodução?</Text>
        <Text style={styles.checkboxOption}>( {opcoes.liberadoReprod ? 'X' : ' '} ) Sim</Text>
        <Text style={styles.checkboxOption}>( {!opcoes.liberadoReprod ? 'X' : ' '} ) Não</Text>
      </View>

      <Text style={styles.paragraph}>
        Na qualidade de titular dos direitos de autor da publicação supracitada, de acordo com a Lei no. 9610/98, autorizo o Instituto Federal de Educação, Ciência e Tecnologia do Amazonas a disponibilizar gratuitamente, sem ressarcimento dos direitos autorais, conforme permissões assinaladas acima, o documento em meio eletrônico na Rede Mundial de Computadores, no formato digital PDF, para fins de leitura, impressão ou download, a título de divulgação científica gerada pelo Instituto, a partir desta data. Estou ciente que o conteúdo disponibilizado é de minha inteira responsabilidade.
      </Text>

      <View style={styles.signatureSection}>
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
          <Text style={styles.signatureLabel}>Autor</Text>
        </View>

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
          <Text style={styles.signatureLabel}>Orientador</Text>
        </View>
      </View>

      <View style={styles.dateLocationRow}>
        <Text style={styles.label}>Local:</Text>
        <Text style={{...styles.value, flex: 0.5}}>{local}</Text>
        <Text style={{...styles.label, marginLeft: 20}}>Data:</Text>
        <Text style={{...styles.value, flex: 0.5}}>{data}</Text>
      </View>

    </Page>
  </Document>
);
