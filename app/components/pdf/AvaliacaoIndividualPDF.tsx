import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, textAlign: 'center' },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  subtitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 20 },
  row: { flexDirection: 'row', marginBottom: 10 },
  label: { fontSize: 11, fontWeight: 'bold', marginRight: 5 },
  value: { fontSize: 11 },
  table: { display: 'flex', flexDirection: 'column', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, marginBottom: 15 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '70%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f0f0', padding: 5 },
  tableColScoreTitle: { width: '15%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f0f0', padding: 5, textAlign: 'center' },
  tableCol: { width: '70%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColScore: { width: '15%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5, textAlign: 'center' },
  tableCellHeader: { margin: 2, fontSize: 10, fontWeight: 'bold' },
  tableCell: { margin: 2, fontSize: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginVertical: 10 },
  signatureBox: { marginTop: 40, alignItems: 'center' },
  signatureLine: { width: 250, borderBottomWidth: 1, marginBottom: 5 },
  signatureSealContainer: { height: 30, justifyContent: 'flex-end', marginBottom: 2 },
  signatureSeal: { fontSize: 8, color: '#4B5563', textAlign: 'center' },
  signatureHash: { fontSize: 7, color: '#9CA3AF', textAlign: 'center' }
});

interface AvaliacaoProps {
  alunoNome: string;
  tituloTrabalho: string;
  orientadorNome: string;
  avaliadorNome: string;
  tipoTrabalho: "TCC1" | "TCC2";
  criterios: Array<{ nome: string; nota: number }>;
  notaFinal: number;
  assinaturaHash?: string;
  assinaturaData?: string;
}

export const AvaliacaoIndividualPDF = ({
  alunoNome,
  tituloTrabalho,
  orientadorNome,
  avaliadorNome,
  tipoTrabalho,
  criterios,
  notaFinal,
  assinaturaHash,
  assinaturaData
}: AvaliacaoProps) => {
  const isTcc1 = tipoTrabalho === "TCC1";

  // Função auxiliar para encontrar nota pelo nome (começo do nome)
  const getNota = (nomeBusca: string) => {
    const crit = criterios.find(c => c.nome.toLowerCase().includes(nomeBusca.toLowerCase()));
    return crit ? crit.nota.toFixed(1) : "0.0";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Instituto Federal de Educação, Ciência e Tecnologia do Amazonas - IFAM</Text>
          <Text style={styles.subtitle}>AVALIAÇÃO DE MONOGRAFIA PELA BANCA EXAMINADORA – {isTcc1 ? "TCC 1" : "TCC 2"}</Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Aluno:</Text>
            <Text style={styles.value}>{alunoNome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Título do Trabalho:</Text>
            <Text style={styles.value}>{tituloTrabalho}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Orientador:</Text>
            <Text style={styles.value}>{orientadorNome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Avaliador:</Text>
            <Text style={styles.value}>{avaliadorNome}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Trabalho Escrito</Text>
        
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Critério</Text></View>
            <View style={styles.tableColScoreTitle}><Text style={styles.tableCellHeader}>Graus</Text></View>
            <View style={styles.tableColScoreTitle}><Text style={styles.tableCellHeader}>Obtido</Text></View>
          </View>
          
          {isTcc1 ? (
            <>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>1. Problema de Pesquisa</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Problema de Pesquisa")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>2. Definição dos Objetivos: geral e específicos</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Definição dos Objetivos")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>3. Revisão Bibliográfica: Fundamentação do tema, citações e ABNT</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Fundamentação")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>3. Revisão Bibliográfica: Abordagens seqüencial e lógica com base no objetivo</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 0,5</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Abordagem")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>4. Orientação Metodológica: Procedimentos adequados e bem definidos</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 0,5</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Metodológica")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>5. Proposta da Solução do Problema Identificado</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Proposta da Solução")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>6. Discussão dos Riscos e Dificuldades</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 0,5</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Riscos e Dificuldades")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>7. Solução Proposta</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 0,5</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Solução Proposta")}</Text></View>
              </View>
            </>
          ) : (
            <>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>1. Introdução: Justificativa da escolha, relevância do tema e definição do problema.</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Introdução")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>2. Definição dos Objetivos: Apresentação com coerência e clareza do problema pesquisado.</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Objetivos")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>3. Revisão Bibliográfica: Fundamentação do tema, citações e ABNT.</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Revisão Bibliográfica")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>4. Orientação Metodológica: Procedimentos Adequados e bem definidos</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 0,5</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Metodológica")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>5. Apresentação dos resultados: Clareza e objetividade</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Apresentação dos resultados")}</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>6. Discussão dos Resultados: Confronto dos dados atuais com estudos anteriores.</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 1,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Discussão dos Resultados")}</Text></View>
              </View>
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Apresentação Oral</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{isTcc1 ? "8." : "7."} Apresentação: Qualidade do material, linguagem, respostas.</Text></View>
            <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 3,5</Text></View>
            <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Apresentação Oral")}</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Cumprimento do tempo estabelecido</Text></View>
            <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 – 0,5</Text></View>
            <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("tempo")}</Text></View>
          </View>
        </View>

        {!isTcc1 && (
          <>
            <Text style={styles.sectionTitle}>Implementação do Software</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>8. Implementação do TCC: Avaliação do projeto, conformidade com objetivos.</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>0,0 - 10,0</Text></View>
                <View style={styles.tableColScore}><Text style={styles.tableCell}>{getNota("Software")}</Text></View>
              </View>
            </View>
          </>
        )}

        <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>
            Nota Final {isTcc1 ? "(Soma)" : "(Soma / 2)"} = {notaFinal.toFixed(2)}
          </Text>
        </View>

        <View style={styles.signatureBox}>
          <View style={styles.signatureSealContainer}>
            {assinaturaHash ? (
              <View>
                <Text style={styles.signatureSeal}>Documento assinado eletronicamente por {avaliadorNome} em {assinaturaData}</Text>
                <Text style={styles.signatureHash}>Código de verificação: {assinaturaHash}</Text>
              </View>
            ) : (
              <Text style={[styles.signatureSeal, { fontStyle: 'italic' }]}>Assinatura Eletrônica Pendente</Text>
            )}
          </View>
          <View style={styles.signatureLine} />
          <Text style={styles.label}>EXAMINADOR: {avaliadorNome}</Text>
        </View>
      </Page>
    </Document>
  );
};
