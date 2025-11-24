import { NextRequest, NextResponse } from "next/server";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import {
  canTransition,
  getNextStates,
  getTransitionDescription,
} from "@/app/lib/trabalhoStateMachine";
import { TrabalhoStatus } from "@prisma/client";
import { z } from "zod";
import { getRequestMetadata } from "@/app/lib/requestMetadata";

const transitionSchema = z.object({
  novoStatus: z.nativeEnum(TrabalhoStatus),
  observacao: z.string().optional(),
});

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = await context.params;

      const trabalho = await prisma.trabalho.findUnique({
        where: { id },
        include: {
          banca: {
            include: {
              membros: true,
            },
          },
        },
      });

      if (!trabalho) {
        return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
      }

      const hasAccess =
        user.role === "ADMIN" ||
        user.role === "COORDENADOR" ||
        trabalho.alunoId === user.userId ||
        trabalho.orientadorId === user.userId;

      if (!hasAccess) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }

      const nextStates = getNextStates(trabalho.status, user.role);

      const hasBanca = !!trabalho.banca && trabalho.banca.membros.length > 0;

      const transitionsInfo = nextStates.map((status) => ({
        status,
        description: getTransitionDescription(trabalho.status, status),
        valid: canTransition(trabalho.status, status, user.role, hasBanca).valid,
      }));

      return NextResponse.json({
        currentStatus: trabalho.status,
        possibleTransitions: transitionsInfo,
        hasBanca,
      });
    } catch (error) {
      console.error("Erro ao buscar transições:", error);
      return NextResponse.json(
        { error: "Erro ao buscar transições de status" },
        { status: 500 }
      );
    }
  }
);

export const POST = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request: NextRequest, user, context) => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      const { novoStatus, observacao } = transitionSchema.parse(body);

      const trabalho = await prisma.trabalho.findUnique({
        where: { id },
        include: {
          aluno: true,
          orientador: true,
          banca: {
            include: {
              membros: true,
            },
          },
        },
      });

      if (!trabalho) {
        return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
      }

      const hasBanca = !!trabalho.banca && trabalho.banca.membros.length > 0;

      const validation = canTransition(trabalho.status, novoStatus, user.role, hasBanca);

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const trabalhoAtualizado = await prisma.trabalho.update({
        where: { id },
        data: {
          status: novoStatus,
          ...(novoStatus === "SUBMETIDO" && !trabalho.dataSubmissao
            ? { dataSubmissao: new Date() }
            : {}),
          ...(novoStatus === "APROVADO" || novoStatus === "REPROVADO"
            ? { dataDefesa: new Date() }
            : {}),
        },
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
              matricula: true,
              curso: true,
            },
          },
          orientador: {
            select: {
              id: true,
              nome: true,
              email: true,
              titulacao: true,
              departamento: true,
            },
          },
        },
      });

      const { ipAddress, userAgent } = getRequestMetadata(request);

      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          acao: "TRANSITION_STATUS",
          entidade: "TRABALHO",
          entidadeId: trabalho.id,
          ipAddress,
          userAgent,
          detalhes: {
            statusAnterior: trabalho.status,
            novoStatus,
            descricao: getTransitionDescription(trabalho.status, novoStatus),
            observacao,
          },
        },
      });

      const notificacoes = [];

      if (user.userId !== trabalho.alunoId) {
        notificacoes.push({
          usuarioId: trabalho.alunoId,
          tipo: "MUDANCA_STATUS",
          titulo: "Status do trabalho alterado",
          mensagem: `Seu trabalho "${
            trabalho.titulo
          }" mudou de status: ${getTransitionDescription(trabalho.status, novoStatus)}${
            observacao ? `. Observação: ${observacao}` : ""
          }`,
          link: `/trabalhos/${trabalho.id}`,
        });
      }

      if (user.userId !== trabalho.orientadorId) {
        notificacoes.push({
          usuarioId: trabalho.orientadorId,
          tipo: "MUDANCA_STATUS",
          titulo: "Status do trabalho orientado alterado",
          mensagem: `O trabalho "${
            trabalho.titulo
          }" mudou de status: ${getTransitionDescription(trabalho.status, novoStatus)}`,
          link: `/trabalhos/${trabalho.id}`,
        });
      }

      if (notificacoes.length > 0) {
        await prisma.notificacao.createMany({
          data: notificacoes,
        });
      }

      return NextResponse.json({
        message: "Status atualizado com sucesso",
        trabalho: trabalhoAtualizado,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos", details: error.issues },
          { status: 400 }
        );
      }
      console.error("Erro ao atualizar status:", error);
      return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
    }
  }
);
