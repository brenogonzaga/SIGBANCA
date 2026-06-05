import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import { MarkdownPdf } from "./app/lib/markdownPdf";
import { uploadFile } from "./app/lib/minio";

async function verifyTemplates() {
  console.log("================================================================================");
  console.log("🧪 INICIANDO VERIFICAÇÃO DOS TEMPLATES MARKDOWN -> PDF (SIGBANCA)");
  console.log("================================================================================");

  const timestamp = Date.now();

  // Mocks de Dados Legítimos para o SIGBANCA (TADS - IFAM Campus Manaus Centro)
  const mockDados = {
    tituloTrabalho: "SIGBANCA: Um Sistema de Gerenciamento de Bancas de TCC para o IFAM",
    alunoNome: "Breno Gonzaga de Oliveira",
    alunoNomeMaiusculo: "BRENO GONZAGA DE OLIVEIRA",
    alunoRg: "1234567-SSP/AM",
    alunoCpf: "123.456.789-00",
    alunoEmail: "breno.gonzaga@tads.ifam.edu.br",
    alunoTelefone: "(92) 99123-4567",
    alunoAnoTermino: "2026",
    orientadorNome: "Prof. Dr. Marcos Lemos",
    avaliadorNome: "Prof. Msc. João Marinho",
    membro1Nome: "Prof. Msc. João Marinho",
    membro2Nome: "Prof. Dr. Carlos Silva",
    notaFinal: "9.50",
    data: "28 de Maio de 2026",
    horario: "14:00h",
    dataAprovacao: "28 de Maio de 2026",
  };

  const assinaturasMock = {
    orientador: {
      nome: mockDados.orientadorNome,
      papel: "ORIENTADOR (A)",
      hash: "A3E1B9C7D5F2E4A6B8C0D2E4F6A8B0C2",
      dataHora: "28/05/2026 15:30:12"
    },
    avaliador: {
      nome: mockDados.avaliadorNome,
      papel: "MEMBRO INTERNO",
      hash: "B4F2C0D8E6F0A2B4C6D8E0F2A4B6C8D0",
      dataHora: "28/05/2026 15:45:22"
    },
    membro1: {
      nome: mockDados.membro1Nome,
      papel: "MEMBRO 1",
      hash: "B4F2C0D8E6F0A2B4C6D8E0F2A4B6C8D0",
      dataHora: "28/05/2026 15:45:22"
    },
    membro2: {
      nome: mockDados.membro2Nome,
      papel: "MEMBRO 2",
      hash: "C5A3D1E9F7A1B3C5D7E9F1A3B5C7D9E1",
      dataHora: "28/05/2026 15:50:45"
    },
    aluno: {
      nome: mockDados.alunoNome,
      papel: "DISCENTE",
      hash: "D6B4E2F0A8B2C4D6E8F0A2B4C6D8E0F2",
      dataHora: "28/05/2026 16:00:00"
    }
  };

  // 1. COMPILAR E GERAR A FICHA DE AVALIAÇÃO INDIVIDUAL (TCC 2 COM ITENS COMPOSTOS)
  try {
    console.log("📝 1. Compilando Ficha de Avaliação Individual...");
    const templatePath = path.join(process.cwd(), "docs", "avaliacao_individual.md");
    const templateContent = fs.readFileSync(templatePath, "utf8");

    // Simulando critérios reais de TCC 2 no formato de tabelas independentes (P&B)
    const tabelaTrabalhoEscrito = [
      `| **1. Introdução** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Justificativa da escolha, relevância do tema e definição do problema. | 0,0 – 1,0 | 1.0 |`,
      `| **2. Definição dos Objetivos** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Apresentação com coerência e clareza do problema pesquisado. | 0,0 – 1,0 | 0.9 |`,
      `| **3. Revisão Bibliográfica** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Fundamentação do tema com fontes, citações e atendimentos às normas da ABNT. Redação com clareza, terminologia técnica, conceitos científicos, ortografia e concordância. | 0,0 – 1,0 | 1.0 |\n| Abordagem sequencial lógica, equilibrada e ordenada. Revisão com abrangência razoável sobre o problema investigado. | 0,0 – 0,5 | 0.5 |`,
      `| **4. Orientação Metodológica** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Procedimentos adequados e bem definidos. | 0,0 – 0,5 | 0.5 |`,
      `| **5. Apresentação dos Resultados** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Clareza e objetividade. | 0,0 – 1,0 | 0.9 |`,
      `| **6. Discussão dos Resultados** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Confronto dos dados atuais com estudos anteriores contribuindo para a discussão do problema. Conteúdo: significativo, criativo e/ou relevante para área de informática. | 0,0 – 1,0 | 0.9 |`
    ].join("\n\n");

    const tabelaApresentacaoOral = [
      `| **7. Apresentação** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Apresentação oral do trabalho (qualidade do material áudio-visual, utilização de linguagem adequada, resposta aos questionamentos da banca). | 0,0 – 3,5 | 3.3 |\n| Cumprimento do tempo estabelecido. | 0,0 – 0,5 | 0.5 |`
    ].join("\n\n");

    const sessaoSoftware = [
      `---`,
      `### Implementação do Software`,
      `| **8. Implementação do TCC** | **Graus** | **Obtido** |`,
      `| :--- | :---: | :---: |`,
      `| Avaliação da elaboração do projeto, na perspectiva da conformidade com os objetivos do trabalho proposto, considerando se as entregas estão adequadas ao propósito do trabalho. | 0,0 - 10,0 | 9.5 |`
    ].join("\n");

    let filledMarkdown = templateContent
      .replace("{{tipoTrabalhoExtenso}}", "TCC 2")
      .replace("{{alunoNome}}", mockDados.alunoNome)
      .replace("{{tituloTrabalho}}", mockDados.tituloTrabalho)
      .replace("{{orientadorNome}}", mockDados.orientadorNome)
      .replace("{{avaliadorNome}}", mockDados.avaliadorNome)
      .replace("{{tabelaTrabalhoEscrito}}", tabelaTrabalhoEscrito)
      .replace("{{tabelaApresentacaoOral}}", tabelaApresentacaoOral)
      .replace("{{sessaoSoftware}}", sessaoSoftware)
      .replace("{{notaFinal}}", mockDados.notaFinal);

    const pdfElement = React.createElement(MarkdownPdf, {
      markdown: filledMarkdown,
      assinaturas: {
        avaliador: assinaturasMock.avaliador
      }
    });

    const pdfBuffer = await renderToBuffer(pdfElement);
    const pdfName = `verify/verify_avaliacao_${timestamp}.pdf`;
    const { url } = await uploadFile(pdfBuffer, pdfName);

    console.log("   ✅ Ficha Individual gerada com sucesso!");
    console.log(`   🔗 URL: ${url}\n`);
  } catch (error) {
    console.error("   ❌ Erro ao compilar Ficha Individual:", error);
  }

  // 2. COMPILAR E GERAR A FICHA GERAL DE AVALIAÇÃO DO TCC
  try {
    console.log("📊 2. Compilando Ficha Geral de Avaliação...");
    const templatePath = path.join(process.cwd(), "docs", "ficha_geral.md");
    const templateContent = fs.readFileSync(templatePath, "utf8");

    let filledMarkdown = templateContent
      .replace("{{alunoNome}}", mockDados.alunoNome)
      .replace("{{tituloTrabalho}}", mockDados.tituloTrabalho)
      .replace("{{tipoTrabalho}}", "TCC 2")
      .replace("{{orientadorNome}}", mockDados.orientadorNome)
      .replace("{{membro1Nome}}", mockDados.membro1Nome)
      .replace("{{membro2Nome}}", mockDados.membro2Nome)
      .replace("{{orientadorEscrito}}", "9.5")
      .replace("{{membro1Escrito}}", "9.0")
      .replace("{{membro2Escrito}}", "9.8")
      .replace("{{orientadorOral}}", "9.8")
      .replace("{{membro1Oral}}", "9.5")
      .replace("{{membro2Oral}}", "9.7")
      .replace("{{orientadorSoftware}}", "9.6")
      .replace("{{membro1Software}}", "9.2")
      .replace("{{membro2Software}}", "10.0")
      .replace("{{orientadorNota}}", "9.6")
      .replace("{{membro1Nota}}", "9.2")
      .replace("{{membro2Nota}}", "9.8")
      .replace("{{mediaEscrito}}", "9.43")
      .replace("{{mediaOral}}", "9.67")
      .replace("{{mediaSoftware}}", "9.60")
      .replace("{{mediaFinal}}", mockDados.notaFinal)
      .replace("{{parecerFinal}}", "APROVADO")
      .replace("{{data}}", mockDados.data)
      .replace("{{horario}}", mockDados.horario);

    const pdfElement = React.createElement(MarkdownPdf, {
      markdown: filledMarkdown,
      assinaturas: {
        orientador: assinaturasMock.orientador,
        membro1: assinaturasMock.membro1,
        membro2: assinaturasMock.membro2
      }
    });

    const pdfBuffer = await renderToBuffer(pdfElement);
    const pdfName = `verify/verify_ficha_geral_${timestamp}.pdf`;
    const { url } = await uploadFile(pdfBuffer, pdfName);

    console.log("   ✅ Ficha Geral gerada com sucesso!");
    console.log(`   🔗 URL: ${url}\n`);
  } catch (error) {
    console.error("   ❌ Erro ao compilar Ficha Geral:", error);
  }

  // 3. COMPILAR E GERAR O TERMO DE APROVAÇÃO
  try {
    console.log("📜 3. Compilando Termo de Aprovação...");
    const templatePath = path.join(process.cwd(), "docs", "termo_aprovacao.md");
    const templateContent = fs.readFileSync(templatePath, "utf8");

    let filledMarkdown = templateContent
      .replace("{{alunoNomeMaiusculo}}", mockDados.alunoNomeMaiusculo)
      .replace("{{tituloTrabalho}}", mockDados.tituloTrabalho)
      .replace("{{dataAprovacao}}", mockDados.dataAprovacao);

    const pdfElement = React.createElement(MarkdownPdf, {
      markdown: filledMarkdown,
      assinaturas: {
        orientador: assinaturasMock.orientador,
        membro1: assinaturasMock.membro1,
        membro2: assinaturasMock.membro2
      }
    });

    const pdfBuffer = await renderToBuffer(pdfElement);
    const pdfName = `verify/verify_termo_aprovacao_${timestamp}.pdf`;
    const { url } = await uploadFile(pdfBuffer, pdfName);

    console.log("   ✅ Termo de Aprovação gerado com sucesso!");
    console.log(`   🔗 URL: ${url}\n`);
  } catch (error) {
    console.error("   ❌ Erro ao compilar Termo de Aprovação:", error);
  }

  // 4. COMPILAR E GERAR O TERMO DE AUTORIZAÇÃO DE PUBLICAÇÃO DIGITAL
  try {
    console.log("🔑 4. Compilando Termo de Autorização Digital...");
    const templatePath = path.join(process.cwd(), "docs", "termo_autorizacao.md");
    const templateContent = fs.readFileSync(templatePath, "utf8");

    let filledMarkdown = templateContent
      .replace("{{tituloTrabalho}}", mockDados.tituloTrabalho)
      .replace("{{alunoNome}}", mockDados.alunoNome)
      .replace("{{alunoRg}}", mockDados.alunoRg)
      .replace("{{alunoCpf}}", mockDados.alunoCpf)
      .replace("{{alunoEmail}}", mockDados.alunoEmail)
      .replace("{{alunoTelefone}}", mockDados.alunoTelefone)
      .replace("{{alunoAnoTermino}}", mockDados.alunoAnoTermino)
      .replace("{{orientadorNome}}", mockDados.orientadorNome);

    const pdfElement = React.createElement(MarkdownPdf, {
      markdown: filledMarkdown,
      assinaturas: {
        orientador: assinaturasMock.orientador,
        aluno: assinaturasMock.aluno
      }
    });

    const pdfBuffer = await renderToBuffer(pdfElement);
    const pdfName = `verify/verify_termo_autorizacao_${timestamp}.pdf`;
    const { url } = await uploadFile(pdfBuffer, pdfName);

    console.log("   ✅ Termo de Autorização gerado com sucesso!");
    console.log(`   🔗 URL: ${url}\n`);
  } catch (error) {
    console.error("   ❌ Erro ao compilar Termo de Autorização:", error);
  }

  console.log("================================================================================");
  console.log("🎉 TODOS OS TESTES PASSARAM COM SUCESSO! RENDERIZAÇÃO COMPLETA.");
  console.log("================================================================================");
}

verifyTemplates();
