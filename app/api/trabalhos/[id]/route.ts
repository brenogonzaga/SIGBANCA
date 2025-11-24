import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { updateTrabalhoSchema } from "@/app/lib/validationSchemas";
import { z } from "zod";
import {
  canTransition,
  canEditTrabalho,
  getTransitionDescription,
} from "@/app/lib/trabalhoStateMachine";
import { getRequestMetadata } from "@/app/lib/requestMetadata";

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      const trabalho = await prisma.trabalho.findUnique({
        where: { id },
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
              email: true,
              curso: true,
              matricula: true,
            },
          },
          orientador: {
            select: {
              id: true,
              nome: true,
              email: true,
              departamento: true,
              titulacao: true,
            },
          },
          versoes: {
            include: {
              uploadPor: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
              comentarios: {
                include: {
                  autor: {
                    select: {
                      id: true,
                      nome: true,
                      email: true,
                    },
                  },
                },
                orderBy: {
                  dataComentario: "desc",
                },
              },
            },
            orderBy: {
              numeroVersao: "desc",
            },
          },
          banca: {
            include: {
              membros: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nome: true,
                      email: true,
                      titulacao: true,
                      departamento: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!trabalho) {
        return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
      }

      const userId = user.userId;
      const userRole = user.role;

      const isAdmin = userRole === "ADMIN" || userRole === "COORDENADOR";

      const isOwner = trabalho.alunoId === userId || trabalho.orientadorId === userId;

      const isMembro = trabalho.banca?.membros.some((m) => m.usuarioId === userId) || false;

      if (!isAdmin && !isOwner && !isMembro) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }

      return NextResponse.json(trabalho);
    } catch (error) {
      console.error("Erro ao buscar trabalho:", error);
      return NextResponse.json({ error: "Erro ao buscar trabalho" }, { status: 500 });
    }
  }
);

export const PUT = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

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

      const canEdit =
        user.role === "ADMIN" ||
        user.role === "COORDENADOR" ||
        trabalho.orientadorId === user.userId ||
        trabalho.alunoId === user.userId;

      if (!canEdit) {
        return NextResponse.json({ error: "Sem permissão para editar" }, { status: 403 });
      }

      const body = await request.json();
      const validatedData = updateTrabalhoSchema.parse(body);

      if (user.role === "ALUNO") {
        if (validatedData.orientadorId) {
          return NextResponse.json(
            { error: "Aluno não pode alterar o orientador" },
            { status: 403 }
          );
        }

        if (!canEditTrabalho(trabalho.status) && !validatedData.status) {
          return NextResponse.json(
            { error: `Trabalho não pode ser editado no estado: ${trabalho.status}` },
            { status: 400 }
          );
        }
      }

      if (validatedData.status && validatedData.status !== trabalho.status) {
        const hasBanca = !!trabalho.banca && trabalho.banca.membros.length > 0;

        const transitionValidation = canTransition(
          trabalho.status,
          validatedData.status,
          user.role,
          hasBanca
        );

        if (!transitionValidation.valid) {
          return NextResponse.json(
            {
              error: transitionValidation.error,
              currentStatus: trabalho.status,
              attemptedStatus: validatedData.status,
            },
            { status: 400 }
          );
        }

        const { ipAddress, userAgent } = getRequestMetadata(request);

        await prisma.auditLog.create({
          data: {
            usuarioId: user.userId,
            acao: "UPDATE_STATUS",
            entidade: "TRABALHO",
            entidadeId: trabalho.id,
            ipAddress,
            userAgent,
            detalhes: {
              statusAnterior: trabalho.status,
              novoStatus: validatedData.status,
              descricao: getTransitionDescription(trabalho.status, validatedData.status),
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
            }" mudou de status: ${getTransitionDescription(
              trabalho.status,
              validatedData.status
            )}`,
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
            }" mudou de status: ${getTransitionDescription(
              trabalho.status,
              validatedData.status
            )}`,
            link: `/trabalhos/${trabalho.id}`,
          });
        }

        if (notificacoes.length > 0) {
          await prisma.notificacao.createMany({
            data: notificacoes,
          });
        }
      }

      const trabalhoAtualizado = await prisma.trabalho.update({
        where: { id },
        data: validatedData,
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

      return NextResponse.json(trabalhoAtualizado);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos", details: error.issues },
          { status: 400 }
        );
      }
      console.error("Erro ao atualizar trabalho:", error);
      return NextResponse.json({ error: "Erro ao atualizar trabalho" }, { status: 500 });
    }
  }
);

export const DELETE = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Sem permissão para excluir" }, { status: 403 });
      }

      const trabalho = await prisma.trabalho.findUnique({
        where: { id },
        include: { banca: true },
      });

      if (!trabalho) {
        return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
      }

      if (trabalho.banca && trabalho.banca.status === "REALIZADA") {
        return NextResponse.json(
          { error: "Não é possível excluir trabalho com banca realizada" },
          { status: 400 }
        );
      }

      await prisma.trabalho.delete({ where: { id } });

      return NextResponse.json({ message: "Trabalho excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir trabalho:", error);
      return NextResponse.json({ error: "Erro ao excluir trabalho" }, { status: 500 });
    }
  }
);
