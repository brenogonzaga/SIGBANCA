"use server";

import { prisma } from "@/app/lib/prisma";

export async function consolidarBanca(
  bancaId: string,
  orientadorId: string,
  alteracoesPropostas: string
) {
  try {
    // 1. Verificar se quem está consolidando é o Presidente/Orientador
    const membro = await prisma.membroBanca.findUnique({
      where: {
        bancaId_usuarioId: {
          bancaId: bancaId,
          usuarioId: orientadorId,
        },
      },
    });

    if (!membro || membro.papel !== "ORIENTADOR") {
      return { success: false, error: "Apenas o Presidente/Orientador pode consolidar a banca." };
    }

    // 2. Buscar todas as avaliações da banca
    const membrosComAvaliacao = await prisma.membroBanca.findMany({
      where: { bancaId: bancaId },
      include: { avaliacao: true },
    });

    const avaliacoes = membrosComAvaliacao.map(m => m.avaliacao).filter(a => a !== null);

    if (avaliacoes.length === 0) {
      return { success: false, error: "Nenhuma avaliação encontrada para esta banca." };
    }

    if (avaliacoes.length < membrosComAvaliacao.length) {
      return { success: false, error: "Nem todos os membros submeteram suas avaliações." };
    }

    // 3. Calcular a Média Final (Soma das médias finais dividida pela quantidade de membros)
    const somaGeral = avaliacoes.reduce((acc, curr) => acc + curr!.nota, 0);
    const mediaFinal = somaGeral / avaliacoes.length;

    // Critério padrão: Aprovado se nota >= 6.0 (pode ser ajustado conforme a regra de negócio do IFAM)
    let resultado = "REPROVADO";
    if (mediaFinal >= 6.0) {
      resultado = "APROVADO";
    }

    // 4. Atualizar a Banca com a consolidação e alterar status para REALIZADA
    const bancaAtualizada = await prisma.banca.update({
      where: { id: bancaId },
      data: {
        notaFinal: mediaFinal,
        resultado: resultado,
        observacoes: alteracoesPropostas,
        status: "REALIZADA",
      },
    });

    // Atualizar o status do Trabalho
    await prisma.trabalho.update({
      where: { id: bancaAtualizada.trabalhoId },
      data: {
        status: resultado === "APROVADO" ? "APROVADO" : "REPROVADO",
      }
    });

    return { success: true, banca: bancaAtualizada };
  } catch (error) {
    console.error("Erro ao consolidar banca:", error);
    return { success: false, error: "Falha ao consolidar a banca." };
  }
}
