import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  aluno: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 60,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  natureza: {
    marginLeft: '50%',
    textAlign: 'justify',
    fontSize: 11,
    marginBottom: 40,
  },
  aprovacao: {
    textAlign: 'center',
    marginBottom: 30,
  },
  signatureSection: {
    marginTop: 40,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    width: '80%',
    marginTop: 40,
    alignSelf: 'center',
  },
  signatureName: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 5,
  },
  data: {
    textAlign: 'center',
    marginTop: 60,
  }
});

interface FolhaAprovacaoProps {
  dados: {
    aluno: string;
    titulo: string;
    curso: string;
    instituicao: string;
    dataDefesa: string;
    membros: {
      nome: string;
      instituicao: string;
      papel: string;
    }[];
  };
}

export const FolhaAprovacao: React.FC<FolhaAprovacaoProps> = ({ dados }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.aluno}>{dados.aluno}</Text>
      
      <Text style={styles.titulo}>{dados.titulo}</Text>

      <View style={styles.natureza}>
        <Text>
          Trabalho de Conclusão de Curso apresentado ao curso de {dados.curso} do {dados.instituicao}, como requisito parcial para obtenção do título de Bacharel/Técnico em {dados.curso}.
        </Text>
      </View>

      <Text style={styles.aprovacao}>Aprovado em: {dados.dataDefesa}</Text>

      <Text style={{ textAlign: 'center', fontWeight: 'bold' }}>BANCA EXAMINADORA</Text>

      <View style={styles.signatureSection}>
        {dados.membros.map((membro, index) => (
          <View key={index}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{membro.nome}</Text>
            <Text style={styles.signatureName}>{membro.instituicao}</Text>
            <Text style={styles.signatureName}>{membro.papel}</Text>
          </View>
        ))}
      </View>

      <View style={styles.data}>
        <Text>Manaus - AM</Text>
        <Text>{new Date().getFullYear()}</Text>
      </View>
    </Page>
  </Document>
);
