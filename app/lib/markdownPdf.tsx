import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

// Configuração de Estilos Profissionais de PDF (Visual Limpo e Premium)
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#000000', // Preto puro acadêmico
  },
  h1: {
    fontFamily: 'Times-Bold',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  h2: {
    fontFamily: 'Times-Bold',
    fontSize: 11.5,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  h3: {
    fontFamily: 'Times-Bold',
    fontSize: 10.5,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 10.5,
    marginBottom: 10,
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Times-Bold',
    fontWeight: 'bold',
  },
  bulletList: {
    marginLeft: 15,
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletSymbol: {
    width: 10,
    fontSize: 10.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000', // Preto puro
    marginVertical: 12,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 65,
  },
  brasao: {
    width: 55,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000', // Bordas pretas puras finas
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000', // Bordas pretas puras finas
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: 'transparent', // 100% branco/transparente
    padding: 5,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000', // Bordas pretas puras finas
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  tableCellHeader: {
    fontSize: 9.5,
    fontFamily: 'Times-Bold',
    fontWeight: 'bold',
    color: '#000000',
  },
  tableCell: {
    fontSize: 9.5,
    color: '#000000',
  },
  signatureContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  signatureBox: {
    width: '75%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000', // Preto puro para visual acadêmico
    borderStyle: 'dashed',
    borderRadius: 0, // Sem cantos arredondados, padrão impresso
    padding: 8,
    backgroundColor: 'transparent', // 100% transparente para visual limpo
    marginBottom: 10,
  },
  signatureSeal: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#000000', // Preto puro acadêmico
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signatureMeta: {
    fontSize: 7.5,
    color: '#000000',
    textAlign: 'center',
    marginTop: 2,
  },
  signatureHash: {
    fontSize: 7,
    fontFamily: 'Courier',
    color: '#000000',
    textAlign: 'center',
    marginTop: 3,
  },
  signatureLine: {
    width: '75%',
    borderBottomWidth: 1,
    borderBottomColor: '#000000', // Preto puro
    marginTop: 5,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 9.5,
    fontFamily: 'Times-Bold',
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  signatureSubLabel: {
    fontSize: 8.5,
    color: '#000000',
    textAlign: 'center',
  }
});

export interface AssinaturaMembro {
  nome: string;
  papel: string;
  hash?: string | null;
  dataHora?: string | null;
}

export interface MarkdownPdfProps {
  markdown: string;
  assinaturas?: {
    orientador?: AssinaturaMembro | null;
    membro1?: AssinaturaMembro | null;
    membro2?: AssinaturaMembro | null;
    aluno?: AssinaturaMembro | null;
    avaliador?: AssinaturaMembro | null;
  };
}

// Helper para parsear texto inline suportando negrito com **
const renderTextInline = (text: string) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    // Índices ímpares são negritos
    if (index % 2 === 1) {
      return <Text key={index} style={styles.bold}>{part}</Text>;
    }
    return <Text key={index}>{part}</Text>;
  });
};

// Função para parsear estilos CSS inline para objetos compatíveis com React PDF
const parseInlineStyle = (styleStr: string): any => {
  if (!styleStr) return {};
  const stylesObj: any = {};
  const pairs = styleStr.split(';');
  pairs.forEach(pair => {
    const parts = pair.split(':');
    if (parts.length === 2) {
      const rawKey = parts[0].trim();
      const key = rawKey.replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // camelCase
      let val: any = parts[1].trim();
      
      // Remover aspas simples/duplas de valores de strings
      val = val.replace(/['"]/g, '');
      
      // Converter pixels como '10px' para números
      if (val.endsWith('px')) {
        val = Number(val.replace('px', ''));
      } else if (!isNaN(val) && val !== '') {
        val = Number(val);
      }
      stylesObj[key] = val;
    }
  });

  // Se o estilo tiver fontWeight: 'bold', garanta o uso de Times-Bold para fontes serifadas no PDF
  if (stylesObj.fontWeight === 'bold') {
    stylesObj.fontFamily = 'Times-Bold';
  }

  return stylesObj;
};

// Função para processar tags HTML individuais e convertê-las em elementos do PDF
const parseHtmlLine = (line: string, i: number, resolveImagePath: any) => {
  const trimmed = line.trim();

  // Ignorar comentários HTML
  if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
    return { type: 'comment' };
  }

  // Fechamento de Div
  if (trimmed === '</div>' || trimmed === '</div></div>' || trimmed === '</div>\n</div>') {
    return { type: 'close-view' };
  }

  // Tag de Imagem
  if (trimmed.includes('<img')) {
    const srcMatch = trimmed.match(/src="([^"]+)"/);
    const styleMatch = trimmed.match(/style="([^"]+)"/);
    if (srcMatch) {
      const src = resolveImagePath(srcMatch[1]);
      const style = styleMatch ? parseInlineStyle(styleMatch[1]) : {};
      const isLogo = src.includes('logo_ifam');
      return {
        type: 'image',
        element: <Image key={`html-img-${i}`} src={src} style={[isLogo ? styles.logo : styles.brasao, style]} />
      };
    }
  }

  // Tag de Span ou Texto
  if (trimmed.includes('<span') || trimmed.includes('<p')) {
    const styleMatch = trimmed.match(/style="([^"]+)"/);
    const textMatch = trimmed.match(/>([^<]+)</);
    if (textMatch) {
      const text = textMatch[1].trim();
      const style = styleMatch ? parseInlineStyle(styleMatch[1]) : {};
      return {
        type: 'text',
        element: <Text key={`html-txt-${i}`} style={[style]}>{text}</Text>
      };
    }
  }

  // Tag de Div Abertura
  if (trimmed.includes('<div')) {
    const styleMatch = trimmed.match(/style="([^"]+)"/);
    const style = styleMatch ? parseInlineStyle(styleMatch[1]) : {};
    return {
      type: 'open-view',
      style
    };
  }

  return null;
};

export const MarkdownPdf = ({ markdown, assinaturas = {} }: MarkdownPdfProps) => {
  const lines = markdown.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];
  let tableAlignments: ('left' | 'center' | 'right')[] = [];
  const htmlStack: { children: React.ReactNode[], style: any }[] = [];

  const resolveImagePath = (imgSrc: string) => {
    // SVGs Fallback em Base64 (estilizados, limpos e nítidos nas cores oficiais)
    const svgBrasaoFallback = `data:image/svg+xml;base64,${Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="22" fill="#0D5939" stroke="#E3A817" strokeWidth="2" />
        <polygon points="50,18 58,38 80,38 62,51 68,72 50,59 32,72 38,51 20,38 42,38" fill="#E3A817" />
        <circle cx="50" cy="50" r="10" fill="#0A3F66" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    `).toString('base64')}`;

    const svgLogoIfamFallback = `data:image/svg+xml;base64,${Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <rect x="15" y="15" width="22" height="22" fill="#E53E3E" rx="3" />
        <rect x="42" y="15" width="22" height="22" fill="#38A169" rx="3" />
        <rect x="15" y="42" width="22" height="22" fill="#38A169" rx="3" />
        <rect x="42" y="42" width="22" height="22" fill="#38A169" rx="3" />
        <rect x="69" y="42" width="22" height="22" fill="#38A169" rx="3" />
        <rect x="42" y="69" width="22" height="22" fill="#38A169" rx="3" />
      </svg>
    `).toString('base64')}`;

    try {
      if (imgSrc.startsWith('/images/')) {
        const absolutePath = path.join(process.cwd(), 'public', imgSrc);
        if (fs.existsSync(absolutePath)) {
          const content = fs.readFileSync(absolutePath);
          const textPreview = content.slice(0, 50).toString().trim();
          
          // Se o arquivo começar com '<!' ou 'File not found', indica HTML de erro de download.
          // Usaremos o SVG Fallback nesse caso para evitar que o PDF quebre!
          if (textPreview.startsWith('<!') || textPreview.includes('File not found')) {
            return imgSrc.includes('logo_ifam') ? svgLogoIfamFallback : svgBrasaoFallback;
          }

          const ext = path.extname(absolutePath).substring(1) || 'png';
          return `data:image/${ext};base64,${content.toString('base64')}`;
        }
      }
    } catch (e) {
      console.error("Erro ao resolver imagem em base64:", e);
    }
    
    // Fallback geral se a imagem não existir fisicamente no disco
    return imgSrc.includes('logo_ifam') ? svgLogoIfamFallback : svgBrasaoFallback;
  };

  const renderTable = (headers: string[], rows: string[][], alignments: ('left' | 'center' | 'right')[], key: number) => {
    // Determinar largura proporcional das colunas. A primeira coluna de texto costuma ser maior (50% a 70%)
    const colCount = headers.length;
    let widths: string[] = [];
    if (colCount === 3) {
      widths = ['70%', '15%', '15%']; // Ficha individual
    } else if (colCount === 4) {
      widths = ['40%', '20%', '20%', '20%']; // Ficha geral
    } else {
      widths = Array(colCount).fill(`${100 / colCount}%`);
    }

    return (
      <View key={`table-${key}`} style={styles.table}>
        {/* Header */}
        <View style={styles.tableRow}>
          {headers.map((header, i) => {
            const align = alignments[i] || 'left';
            return (
              <View 
                key={`th-${i}`} 
                style={[
                  styles.tableColHeader, 
                  { width: widths[i], alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }
                ]}
              >
                <Text style={styles.tableCellHeader}>{header.replace(/\*\*/g, '')}</Text>
              </View>
            );
          })}
        </View>
        {/* Rows */}
        {rows.map((row, rowIndex) => (
          <View key={`tr-${rowIndex}`} style={styles.tableRow}>
            {row.map((cell, colIndex) => {
              const align = alignments[colIndex] || 'left';
              const isCellBold = cell.trim().startsWith('**') && cell.trim().endsWith('**');
              const cellText = cell.replace(/\*\*/g, '').trim();
              return (
                <View 
                  key={`td-${colIndex}`} 
                  style={[
                    styles.tableCol, 
                    { width: widths[colIndex], alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }
                  ]}
                >
                  <Text style={[styles.tableCell, isCellBold ? styles.bold : {}]}>{cellText}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderSeloAssinatura = (dados: AssinaturaMembro | null | undefined, key: number) => {
    if (!dados) {
      return (
        <View key={`sig-pend-${key}`} style={styles.signatureContainer}>
          <Text style={[styles.signatureSeal, { color: '#EF4444' }]}>
            Assinatura Eletrônica Pendente
          </Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>{dados?.nome || 'Avaliador'}</Text>
          <Text style={styles.signatureSubLabel}>{dados?.papel || 'Membro da Banca'}</Text>
        </View>
      );
    }

    const { nome, papel, hash, dataHora } = dados;

    return (
      <View key={`sig-${key}`} style={styles.signatureContainer}>
        {hash ? (
          <View style={styles.signatureBox}>
            <Text style={styles.signatureSeal}>Documento Assinado Eletronicamente</Text>
            <Text style={styles.signatureMeta}>Por {nome} em {dataHora}</Text>
            <Text style={styles.signatureHash}>Hash SHA-256: {hash}</Text>
          </View>
        ) : (
          <View style={[styles.signatureBox, { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.signatureSeal, { color: '#DC2626' }]}>Assinatura Eletrônica Pendente</Text>
          </View>
        )}
        <View style={styles.signatureLine} />
        <Text style={styles.signatureLabel}>{nome}</Text>
        <Text style={styles.signatureSubLabel}>{papel}</Text>
      </View>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignorar comentários HTML
    if (line.startsWith('<!--') && line.endsWith('-->')) {
      continue;
    }

    // Processamento de Tags HTML (para layout rico de cabeçalho)
    const isHtmlLine = line.startsWith('<') || line.startsWith('</');
    if (isHtmlLine || htmlStack.length > 0) {
      const htmlResult = parseHtmlLine(line, i, resolveImagePath);
      if (htmlResult) {
        if (htmlResult.type === 'comment') {
          continue;
        }
        if (htmlResult.type === 'open-view') {
          htmlStack.push({ children: [], style: htmlResult.style });
        } else if (htmlResult.type === 'close-view') {
          const closed = htmlStack.pop();
          if (closed) {
            const viewElement = (
              <View key={`html-view-${i}`} style={closed.style}>
                {closed.children}
              </View>
            );
            const parent = htmlStack[htmlStack.length - 1];
            if (parent) {
              parent.children.push(viewElement);
            } else {
              elements.push(viewElement);
            }
          }
        } else if (htmlResult.type === 'image' || htmlResult.type === 'text') {
          const current = htmlStack[htmlStack.length - 1];
          if (current) {
            current.children.push(htmlResult.element);
          } else {
            elements.push(htmlResult.element);
          }
        }
        continue;
      }
    }

    // 1. Processar Tabelas Markdown
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
        tableHeaders = [];
        tableAlignments = [];

        // Ler cabeçalho
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableHeaders = cells;
        
        // Ler linha divisória (alinhamento) na próxima linha
        const nextLine = lines[i + 1]?.trim() || '';
        if (nextLine.startsWith('|') && nextLine.includes('---')) {
          const alignCells = nextLine.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
          tableAlignments = alignCells.map(cell => {
            if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
            if (cell.endsWith(':')) return 'right';
            return 'left';
          });
          i++; // Pular a linha de alinhamento
        }
      } else {
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Finalizou a tabela
      elements.push(renderTable(tableHeaders, tableRows, tableAlignments, i));
      inTable = false;
    }

    if (line === '') continue;

    // 2. Imagens
    if (line.startsWith('![') && line.includes('](')) {
      const match = line.match(/!\[([^\]]*)\]\(([^)]*)\)/);
      if (match) {
        const alt = match[1];
        const src = resolveImagePath(match[2]);
        const isLogo = src.includes('logo_ifam');
        elements.push(
          <View key={`img-${i}`} style={styles.imageContainer}>
            <Image src={src} style={isLogo ? styles.logo : styles.brasao} />
          </View>
        );
      }
      continue;
    }

    // 3. Quebras de Seção e Linha Horizontal
    if (line === '---') {
      elements.push(<View key={`div-${i}`} style={styles.divider} />);
      continue;
    }

    // 4. Cabeçalhos
    if (line.startsWith('# ')) {
      elements.push(<Text key={`h1-${i}`} style={styles.h1}>{line.replace('# ', '')}</Text>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<Text key={`h2-${i}`} style={styles.h2}>{line.replace('## ', '')}</Text>);
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<Text key={`h3-${i}`} style={styles.h3}>{line.replace('### ', '')}</Text>);
      continue;
    }

    // 5. Listas com marcadores (* ou -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const itemText = line.substring(2);
      elements.push(
        <View key={`list-${i}`} style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletSymbol}>•</Text>
            <Text style={styles.bulletText}>{renderTextInline(itemText)}</Text>
          </View>
        </View>
      );
      continue;
    }

    // 6. Selos de Assinatura Especiais
    if (line === '[ASSINATURA_ORIENTADOR]') {
      elements.push(renderSeloAssinatura(assinaturas.orientador, i));
      continue;
    }
    if (line === '[ASSINATURA_AVALIADOR1]') {
      elements.push(renderSeloAssinatura(assinaturas.membro1, i));
      continue;
    }
    if (line === '[ASSINATURA_AVALIADOR2]') {
      elements.push(renderSeloAssinatura(assinaturas.membro2, i));
      continue;
    }
    if (line === '[ASSINATURA_ALUNO]') {
      elements.push(renderSeloAssinatura(assinaturas.aluno, i));
      continue;
    }
    if (line === '[ASSINATURA_AVALIADOR]') {
      elements.push(renderSeloAssinatura(assinaturas.avaliador, i));
      continue;
    }

    // 7. Parágrafos Normais
    elements.push(
      <Text key={`p-${i}`} style={styles.paragraph}>
        {renderTextInline(line)}
      </Text>
    );
  }

  // Se o loop terminou e ainda estávamos processando uma tabela, renderiza ela
  if (inTable) {
    elements.push(renderTable(tableHeaders, tableRows, tableAlignments, lines.length));
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {elements}
      </Page>
    </Document>
  );
};
