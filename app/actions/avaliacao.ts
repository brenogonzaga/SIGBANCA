"use server";

import { prisma } from "@/app/lib/prisma";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { AvaliacaoIndividualPDF } from "@/app/components/pdf/AvaliacaoIndividualPDF";
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
        { nome: "Revisão Bibliográfica", nota: notas.revisao || 0 },
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

    // 6. Gerar o PDF com a Assinatura Eletrônica
    try {
      const pdfElement = React.createElement(AvaliacaoIndividualPDF, {
        alunoNome: banca.trabalho.aluno.nome,
        tituloTrabalho: banca.trabalho.titulo,
        orientadorNome: banca.trabalho.orientador.nome,
        avaliadorNome: avaliador.nome,
        tipoTrabalho: banca.trabalho.tipo as "TCC1" | "TCC2",
        criterios: criteriosData,
        notaFinal: notaFinalIndividual,
        assinaturaHash: assinatura.hashAssinatura,
        assinaturaData: dataHoraFormatada,
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
