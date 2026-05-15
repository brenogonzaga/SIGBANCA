import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Estilos para o documento PDF
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  content: {
    textAlign: 'justify',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textDecoration: 'underline',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableColHeader: {
    width: '70%',
    padding: 5,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableColHeaderNote: {
    width: '30%',
    padding: 5,
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCol: {
    width: '70%',
    padding: 5,
  },
  tableColNote: {
    width: '30%',
    padding: 5,
    textAlign: 'center',
  },
  signatureSection: {
    marginTop: 50,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    width: '70%',
    marginTop: 30,
    alignSelf: 'center',
  },
  signatureName: {
    textAlign: 'center',
    fontSize: 10,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 10,
  }
});

interface AtaDefesaProps {
  dados: {
    instituicao: string;
    campus: string;
    curso: string;
    aluno: string;
    tituloTrabalho: string;
    data: string;
    horario: string;
    local: string;
    membros: {
      nome: string;
      papel: string;
      nota?: number;
    }[];
    notaFinal: number;
    resultado: string;
  };
}

export const AtaDefesa: React.FC<AtaDefesaProps> = ({ dados }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        {/* Placeholder para logo do IFAM */}
        <Text style={styles.title}>{dados.instituicao}</Text>
        <Text style={styles.subtitle}>{dados.campus}</Text>
        <Text style={styles.subtitle}>Coordenação do Curso de {dados.curso}</Text>
      </View>

      <Text style={styles.title}>ATA DE DEFESA DE TRABALHO DE CONCLUSÃO DE CURSO</Text>

      <View style={styles.content}>
        <Text>
          Aos {dados.data}, às {dados.horario}, no {dados.local}, reuniu-se a Banca Examinadora para avaliar a defesa do Trabalho de Conclusão de Curso intitulado "{dados.tituloTrabalho}", de autoria do(a) discente {dados.aluno}.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Membros da Banca e Avaliações:</Text>
      
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text>Membro</Text></View>
          <View style={styles.tableColHeaderNote}><Text>Nota</Text></View>
        </View>
        {dados.membros.map((membro, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text>{membro.nome} ({membro.papel})</Text>
            </View>
            <View style={styles.tableColNote}>
              <Text>{membro.nota?.toFixed(1) || '-'}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.content}>
        <Text style={{ fontWeight: 'bold' }}>
          Resultado Final: {dados.resultado} com Nota Final: {dados.notaFinal.toFixed(1)}
        </Text>
      </View>

      <View style={styles.signatureSection}>
        {dados.membros.map((membro, index) => (
          <View key={index}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{membro.nome}</Text>
            <Text style={styles.signatureName}>{membro.papel}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Documento gerado eletronicamente pelo Sistema SIGBANCA - {new Date().toLocaleDateString()}</Text>
        <Text>A autenticidade deste documento pode ser verificada no portal do sistema.</Text>
      </View>
    </Page>
  </Document>
);
