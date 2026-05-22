import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 70,
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
  },
  aluno: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 80,
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 60,
    textTransform: 'uppercase',
  },
  natureza: {
    marginLeft: '45%',
    textAlign: 'justify',
    fontSize: 11,
    marginBottom: 50,
  },
  aprovacao: {
    textAlign: 'left',
    marginBottom: 30,
    marginTop: 20,
    fontSize: 11,
  },
  bancaTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 11,
    marginBottom: 40,
    textTransform: 'uppercase',
  },
  signatureSection: {
    marginTop: 20,
  },
  signatureBlock: {
    marginBottom: 30,
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    width: '80%',
    marginBottom: 5,
  },
  signatureName: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
  },
  signatureInst: {
    textAlign: 'center',
    fontSize: 10,
  },
  signatureSealContainer: {
    height: 30,
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  signatureSeal: {
    marginTop: 6,
    fontSize: 8,
    color: '#4B5563',
    textAlign: 'center',
  },
  signatureHash: {
    fontSize: 7,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 70,
    right: 70,
    fontSize: 8,
    textAlign: 'right',
  }
});

interface FolhaAprovacaoProps {
  dados: {
    aluno: string;
    titulo: string;
    curso: string;
    instituicao: string;
    campus: string;
    dataDefesa: string;
    membros: {
      nome: string;
      instituicao: string;
      papel: string;
      assinatura?: {
        hash: string;
        data: string;
      } | null;
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
          Trabalho de Conclusão de Curso apresentado à banca examinadora Curso Superior de Tecnologia em {dados.curso} do {dados.instituicao} – {dados.campus}, como requisito para o cumprimento da disciplina TCC II – Projeto de Software.
        </Text>
        <Text style={{ marginTop: 10 }}>Orientador: {dados.membros.find(m => m.papel === 'ORIENTADOR')?.nome || 'A definir'}</Text>
      </View>

      <Text style={styles.aprovacao}>
        Aprovado em {dados.dataDefesa}
      </Text>

      <Text style={styles.bancaTitle}>BANCA EXAMINADORA</Text>

      <View style={styles.signatureSection}>
        {dados.membros.map((membro, index) => (
          <View key={index} style={styles.signatureBlock}>
            <View style={styles.signatureSealContainer}>
              {membro.assinatura ? (
                <View>
                  <Text style={styles.signatureSeal}>Assinado eletronicamente em {membro.assinatura.data}</Text>
                  <Text style={styles.signatureHash}>Hash: {membro.assinatura.hash}</Text>
                </View>
              ) : (
                <Text style={[styles.signatureSeal, { fontStyle: 'italic' }]}>Assinatura Eletrônica Pendente</Text>
              )}
            </View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{membro.nome}</Text>
            <Text style={styles.signatureInst}>{membro.instituicao}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>EMAIL nº 403/2024 PROT/CMC (1420080) 23042.001104/2024-26 pg. 7</Text>
      </View>
    </Page>
  </Document>
);
