"use server";

import { prisma } from "@/app/lib/prisma";
import React from "react";
import { MarkdownPdf } from "@/app/lib/markdownPdf";
import { renderToBuffer } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import { uploadFile } from "@/app/lib/minio";
import { verifyPassword } from "@/app/lib/auth";
import crypto from "crypto";
import { headers } from "next/headers";

export async function submeterAvaliacaoIndividual(
  bancaId: string,
  avaliadorId: string,
  notas: Record<string, number>,
  parecer: string,
  senhaAssinatura: string
) {
  try {
    // 1. Verificar senha do avaliador
    const avaliador = await prisma.usuario.findUnique({ where: { id: avaliadorId } });
    if (!avaliador) {
      return { success: false, error: "Usuário não encontrado." };
    }

    const isPasswordValid = await verifyPassword(senhaAssinatura, avaliador.senha);
    if (!isPasswordValid) {
      return { success: false, error: "Senha de assinatura incorreta." };
    }

    // 2. Verificar se o avaliador é membro da banca
    const membro = await prisma.membroBanca.findUnique({
      where: {
        bancaId_usuarioId: {
          bancaId: bancaId,
          usuarioId: avaliadorId,
        },
      },
    });

    if (!membro) {
      return { success: false, error: "Avaliador não é membro desta banca." };
    }

    // 3. Obter o trabalho para saber quem é o aluno, orientador, tipo de TCC, etc
    const banca = await prisma.banca.findUnique({
      where: { id: bancaId },
      include: { 
        trabalho: {
          include: {
            aluno: true,
            orientador: true,
          }
        } 
      }
    });

    if (!banca) {
      return { success: false, error: "Banca não encontrada." };
    }

    const isTcc1 = banca.trabalho.tipo === "TCC1";
    const alunoId = banca.trabalho.alunoId;

    let notaFinalIndividual = 0;
    let criteriosData: any[] = [];

    if (isTcc1) {
      const soma = Object.values(notas).reduce((acc, val) => acc + (Number(val) || 0), 0);
      notaFinalIndividual = soma;

      criteriosData = [
        { nome: "Problema de Pesquisa", nota: notas.problema || 0 },
        { nome: "Definição dos Objetivos", nota: notas.objetivos || 0 },
        { nome: "Revisão - Fundamentação", nota: notas.revisaoFundamentacao || 0 },
        { nome: "Revisão - Abordagem", nota: notas.revisaoAbordagem || 0 },
        { nome: "Orientação Metodológica", nota: notas.metodologia || 0 },
        { nome: "Proposta da Solução", nota: notas.propostaSolucao || 0 },
        { nome: "Riscos e Dificuldades", nota: notas.riscos || 0 },
        { nome: "Solução Proposta", nota: notas.solucaoProposta || 0 },
        { nome: "Apresentação Oral", nota: notas.apresentacao || 0 },
        { nome: "Cumprimento do tempo", nota: notas.tempo || 0 },
      ];
    } else {
      const soma = Object.values(notas).reduce((acc, val) => acc + (Number(val) || 0), 0);
      notaFinalIndividual = soma / 2;

      criteriosData = [
        { nome: "Introdução", nota: notas.introducao || 0 },
        { nome: "Objetivos", nota: notas.objetivos || 0 },
        { nome: "Revisão Bibliográfica - Fundamentação", nota: notas.revisao || 0 },
        { nome: "Revisão Bibliográfica - Abordagem", nota: notas.revisaoAbordagem || 0 },
        { nome: "Orientação Metodológica", nota: notas.metodologia || 0 },
        { nome: "Apresentação dos resultados", nota: notas.resultadosApres || 0 },
        { nome: "Discussão dos Resultados", nota: notas.resultadosDisc || 0 },
        { nome: "Apresentação Oral", nota: notas.apresentacao || 0 },
        { nome: "Cumprimento do tempo", nota: notas.tempo || 0 },
        { nome: "Implementação do Software", nota: notas.software || 0 },
      ];
    }

    // 4. Salvar a avaliação no banco
    const avaliacao = await prisma.avaliacao.upsert({
      where: {
        membroId: membro.id,
      },
      update: {
        nota: notaFinalIndividual,
        parecer: parecer,
        criterios: {
          deleteMany: {},
          create: criteriosData
        }
      },
      create: {
        membroId: membro.id,
        avaliadoPorId: alunoId,
        nota: notaFinalIndividual,
        parecer: parecer,
        criterios: {
          create: criteriosData
        }
      }
    });

    // 5. Gerar Assinatura Eletrônica
    const headerData = await headers();
    const ipAddress = headerData.get("x-forwarded-for") || "127.0.0.1";
    const conteudoAssinatura = `AVALIACAO:${avaliacao.id}:${avaliador.id}:${Date.now()}`;
    const hashAssinatura = crypto.createHash('sha256').update(conteudoAssinatura).digest('hex').substring(0, 32).toUpperCase();

    const assinatura = await prisma.assinaturaEletronica.create({
      data: {
        usuarioId: avaliador.id,
        tipoDocumento: "AVALIACAO_INDIVIDUAL",
        entidadeId: avaliacao.id,
        hashAssinatura: hashAssinatura,
        ipAddress: ipAddress
      }
    });

    const dataHoraFormatada = assinatura.dataHora.toLocaleString('pt-BR');

    // 6. Gerar o PDF com a Assinatura Eletrônica a partir do template Markdown
    try {
      const templatePath = path.join(process.cwd(), "docs", "avaliacao_individual.md");
      const templateContent = fs.readFileSync(templatePath, "utf8");

      let tabelaTrabalhoEscrito = "";
      let tabelaApresentacaoOral = "";
      let sessaoSoftware = "";

      if (isTcc1) {
        tabelaTrabalhoEscrito = [
          `| **1. Problema de Pesquisa** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Problema de Pesquisa. | 0,0 – 1,0 | ${(notas.problema ?? 0).toFixed(1)} |`,
          `| **2. Definição dos Objetivos** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Definição dos Objetivos: geral e específicos. | 0,0 – 1,0 | ${(notas.objetivos ?? 0).toFixed(1)} |`,
          `| **3. Revisão Bibliográfica** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Fundamentação do tema, citações e ABNT. | 0,0 – 1,0 | ${(notas.revisaoFundamentacao ?? 0).toFixed(1)} |\n| Abordagens seqüencial e lógica com base no objetivo. | 0,0 – 0,5 | ${(notas.revisaoAbordagem ?? 0).toFixed(1)} |`,
          `| **4. Orientação Metodológica** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Procedimentos adequados e bem definidos. | 0,0 – 0,5 | ${(notas.metodologia ?? 0).toFixed(1)} |`,
          `| **5. Proposta da Solução** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Proposta da Solução do Problema Identificado. | 0,0 – 1,0 | ${(notas.propostaSolucao ?? 0).toFixed(1)} |`,
          `| **6. Discussão dos Riscos** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Discussão dos Riscos e Dificuldades. | 0,0 – 0,5 | ${(notas.riscos ?? 0).toFixed(1)} |`,
          `| **7. Solução Proposta** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Solução Proposta. | 0,0 – 0,5 | ${(notas.solucaoProposta ?? 0).toFixed(1)} |`
        ].join("\n\n");

        tabelaApresentacaoOral = [
          `| **8. Apresentação** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Apresentação oral do trabalho (qualidade do material áudio-visual, utilização de linguagem adequada, resposta aos questionamentos da banca). | 0,0 – 3,5 | ${(notas.apresentacao ?? 0).toFixed(1)} |\n| Cumprimento do tempo estabelecido. | 0,0 – 0,5 | ${(notas.tempo ?? 0).toFixed(1)} |`
        ].join("\n\n");
      } else {
        tabelaTrabalhoEscrito = [
          `| **1. Introdução** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Justificativa da escolha, relevância do tema e definição do problema. | 0,0 – 1,0 | ${(notas.introducao ?? 0).toFixed(1)} |`,
          `| **2. Definição dos Objetivos** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Apresentação com coerência e clareza do problema pesquisado. | 0,0 – 1,0 | ${(notas.objetivos ?? 0).toFixed(1)} |`,
          `| **3. Revisão Bibliográfica** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Fundamentação do tema com fontes, citações e atendimentos às normas da ABNT. Redação com clareza, terminologia técnica, conceitos científicos, ortografia e concordância. | 0,0 – 1,0 | ${(notas.revisao ?? 0).toFixed(1)} |\n| Abordagem sequencial lógica, equilibrada e ordenada. Revisão com abrangência razoável sobre o problema investigado. | 0,0 – 0,5 | ${(notas.revisaoAbordagem ?? 0).toFixed(1)} |`,
          `| **4. Orientação Metodológica** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Procedimentos adequados e bem definidos. | 0,0 – 0,5 | ${(notas.metodologia ?? 0).toFixed(1)} |`,
          `| **5. Apresentação dos Resultados** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Clareza e objetividade. | 0,0 – 1,0 | ${(notas.resultadosApres ?? 0).toFixed(1)} |`,
          `| **6. Discussão dos Resultados** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Confronto dos dados atuais com estudos anteriores contribuindo para a discussão do problema. Conteúdo: significativo, criativo e/ou relevante para área de informática. | 0,0 – 1,0 | ${(notas.resultadosDisc ?? 0).toFixed(1)} |`
        ].join("\n\n");

        tabelaApresentacaoOral = [
          `| **7. Apresentação** | **Graus** | **Obtido** |\n| :--- | :---: | :---: |\n| Apresentação oral do trabalho (qualidade do material áudio-visual, utilização de linguagem adequada, resposta aos questionamentos da banca). | 0,0 – 3,5 | ${(notas.apresentacao ?? 0).toFixed(1)} |\n| Cumprimento do tempo estabelecido. | 0,0 – 0,5 | ${(notas.tempo ?? 0).toFixed(1)} |`
        ].join("\n\n");

        sessaoSoftware = [
          `---`,
          `### Implementação do Software`,
          `| **8. Implementação do TCC** | **Graus** | **Obtido** |`,
          `| :--- | :---: | :---: |`,
          `| Avaliação da elaboração do projeto, na perspectiva da conformidade com os objetivos do trabalho proposto, considerando se as entregas estão adequadas ao propósito do trabalho. | 0,0 - 10,0 | ${(notas.software ?? 0).toFixed(1)} |`
        ].join("\n");
      }

      let filledMarkdown = templateContent
        .replace("{{tipoTrabalhoExtenso}}", isTcc1 ? "TCC 1" : "TCC 2")
        .replace("{{alunoNome}}", banca.trabalho.aluno.nome)
        .replace("{{tituloTrabalho}}", banca.trabalho.titulo)
        .replace("{{orientadorNome}}", banca.trabalho.orientador.nome)
        .replace("{{avaliadorNome}}", avaliador.nome)
        .replace("{{tabelaTrabalhoEscrito}}", tabelaTrabalhoEscrito)
        .replace("{{tabelaApresentacaoOral}}", tabelaApresentacaoOral)
        .replace("{{sessaoSoftware}}", sessaoSoftware)
        .replace("{{notaFinal}}", notaFinalIndividual.toFixed(2));

      const pdfElement = React.createElement(MarkdownPdf, {
        markdown: filledMarkdown,
        assinaturas: {
          avaliador: {
            nome: avaliador.nome,
            papel: membro.papel === "ORIENTADOR" ? "ORIENTADOR (A)" : membro.papel,
            hash: assinatura.hashAssinatura,
            dataHora: dataHoraFormatada
          }
        }
      });

      const pdfBuffer = await renderToBuffer(pdfElement);
      const pdfPath = `avaliacoes/${bancaId}_${avaliadorId}_${Date.now()}.pdf`;
      const { url } = await uploadFile(pdfBuffer, pdfPath);

      // Atualizar a avaliação com a URL do PDF
      await prisma.avaliacao.update({
        where: { id: avaliacao.id },
        data: { documentoUrl: url }
      });

      // Atualiza o status da banca para EM_ANDAMENTO se ainda estiver como AGENDADA
      if (banca.status === "AGENDADA") {
        await prisma.banca.update({
          where: { id: bancaId },
          data: { status: "EM_ANDAMENTO" }
        });
      }
    } catch (pdfError) {
      console.error("Erro ao gerar PDF da avaliação:", pdfError);
      // Não falha a submissão se o PDF falhar, mas loga o erro
    }

    return { success: true, avaliacao };
  } catch (error) {
    console.error("Erro ao submeter avaliação:", error);
    return { success: false, error: "Falha ao registrar a avaliação." };
  }
}
