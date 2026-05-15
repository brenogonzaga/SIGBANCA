import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 70,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.2,
  },
  box: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 20,
    marginTop: 300, // Centralizado na parte inferior da página conforme padrão
  },
  header: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  cutter: {
    width: 40,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    paddingLeft: 10,
  },
  title: {
    marginBottom: 5,
  },
  details: {
    marginBottom: 10,
  },
  keywords: {
    marginTop: 10,
  },
  footer: {
    marginTop: 15,
    paddingTop: 5,
    borderTopWidth: 1,
    fontSize: 9,
  },
  cdd: {
    textAlign: 'right',
    marginTop: 5,
    fontWeight: 'bold',
  }
});

interface FichaCatalograficaProps {
  dados: {
    autor: string; // Ex: Souza, Leonardo Henrique Lima de
    titulo: string;
    subtitulo?: string;
    orientador: string;
    ano: string;
    paginas: string;
    curso: string;
    campus: string;
    palavrasChave: string[];
    cutter: string; // Ex: S729m
    cdd: string; // Ex: 005.3
    bibliotecario: string;
    crb: string;
  };
}

export const FichaCatalografica: React.FC<FichaCatalograficaProps> = ({ dados }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.box}>
        <View style={styles.header}>
          <Text>Biblioteca do IFAM – {dados.campus}</Text>
        </View>

        <View style={styles.contentRow}>
          <Text style={styles.cutter}>{dados.cutter}</Text>
          <View style={styles.mainContent}>
            <Text>{dados.autor}.</Text>
            <Text style={styles.title}>
              {dados.titulo}{dados.subtitulo ? `: ${dados.subtitulo}` : ''} / {dados.autor.split(',').reverse().join(' ').trim()}. – {dados.campus.split(' ').pop()}, {dados.ano}.
            </Text>
            <Text style={styles.details}>{dados.paginas} p. : il. color.</Text>
            
            <Text style={styles.details}>
              Monografia ({dados.curso}) – Instituto Federal de Educação, Ciência e Tecnologia do Amazonas, {dados.campus}, {dados.ano}.
            </Text>
            
            <Text>Orientador: {dados.orientador}.</Text>

            <View style={styles.keywords}>
              <Text>
                {dados.palavrasChave.map((kw, i) => `${i + 1}. ${kw}. `).join('')} 
                I. {dados.orientador}. II. Instituto Federal de Educação, Ciência e Tecnologia do Amazonas. III. Título.
              </Text>
            </View>

            <Text style={styles.cdd}>CDD {dados.cdd}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Elaborada por {dados.bibliotecario} {dados.crb}</Text>
        </View>
      </View>
    </Page>
  </Document>
);
