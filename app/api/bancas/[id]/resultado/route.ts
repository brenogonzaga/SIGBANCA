import { NextRequest, NextResponse } from "next/server";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { z } from "zod";
import { getRequestMetadata } from "@/app/lib/requestMetadata";

const registrarResultadoSchema = z.object({
  resultado: z.enum(["APROVADO", "APROVADO_COM_RESSALVAS", "REPROVADO"]),
  notaFinal: z.number().min(0).max(10),
  observacoes: z.string().max(2000).optional(),
  ataUrl: z.string().url().optional(),
});

export const POST = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = await context.params;

      if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Apenas coordenadores podem registrar resultados de banca" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const { resultado, notaFinal, observacoes, ataUrl } =
        registrarResultadoSchema.parse(body);

      const banca = await prisma.banca.findUnique({
        where: { id },
        include: {
          trabalho: {
            include: {
              aluno: true,
              orientador: true,
            },
          },
          membros: {
            include: {
              usuario: true,
              avaliacao: true,
            },
          },
        },
      });

      if (!banca) {
        return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
      }

      if (banca.status !== "AGENDADA" && banca.status !== "EM_ANDAMENTO") {
        return NextResponse.json(
          { error: `Não é possível registrar resultado. Status atual: ${banca.status}` },
          { status: 400 }
        );
      }

      const novoStatusTrabalho =
        resultado === "APROVADO" || resultado === "APROVADO_COM_RESSALVAS"
          ? "APROVADO"
          : "REPROVADO";

      const bancaAtualizada = await prisma.$transaction(async (tx) => {
        const bancaAtual = await tx.banca.update({
          where: { id },
          data: {
            status: "REALIZADA",
            resultado,
            notaFinal,
            observacoes,
            ataUrl,
          },
          include: {
            trabalho: true,
            membros: {
              include: {
                usuario: true,
                avaliacao: true,
              },
            },
          },
        });

        await tx.trabalho.update({
          where: { id: banca.trabalhoId },
          data: {
            status: novoStatusTrabalho,
            dataDefesa: new Date(),
          },
        });

        const { ipAddress, userAgent } = getRequestMetadata(request);

        await tx.auditLog.create({
          data: {
            usuarioId: user.userId,
            acao: "REGISTRAR_RESULTADO_BANCA",
            entidade: "BANCA",
            entidadeId: banca.id,
            ipAddress,
            userAgent,
            detalhes: {
              trabalhoId: banca.trabalhoId,
              resultado,
              notaFinal,
              novoStatusTrabalho,
            },
          },
        });

        await tx.notificacao.createMany({
          data: [
            {
              usuarioId: banca.trabalho.alunoId,
              tipo: "RESULTADO_BANCA",
              titulo: "Resultado da Banca Disponível",
              mensagem: `Sua banca foi finalizada. Resultado: ${resultado}. Nota: ${notaFinal}`,
              link: `/trabalhos/${banca.trabalhoId}`,
            },
            {
              usuarioId: banca.trabalho.orientadorId,
              tipo: "RESULTADO_BANCA",
              titulo: "Resultado da Banca Registrado",
              mensagem: `A banca do trabalho "${banca.trabalho.titulo}" foi finalizada. Resultado: ${resultado}`,
              link: `/trabalhos/${banca.trabalhoId}`,
            },
          ],
        });

        return bancaAtual;
      });

      return NextResponse.json({
        message: "Resultado registrado com sucesso",
        banca: bancaAtualizada,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos", details: error.issues },
          { status: 400 }
        );
      }
      console.error("Erro ao registrar resultado:", error);
      return NextResponse.json(
        { error: "Erro ao registrar resultado da banca" },
        { status: 500 }
      );
    }
  }
);
