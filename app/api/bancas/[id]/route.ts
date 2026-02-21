import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { updateBancaSchema } from "@/app/lib/validationSchemas";
import { z } from "zod";

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      const banca = await prisma.banca.findUnique({
        where: { id },
        include: {
          trabalho: {
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
                },
              },
            },
          },
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
      });

      if (!banca) {
        return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
      }

      const isAluno = user.role === "ALUNO" && banca.trabalho.alunoId === user.userId;
      const isMembro = banca.membros.some((m) => m.usuarioId === user.userId);
      const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";

      if (!isAluno && !isMembro && !isAdmin) {
        return NextResponse.json(
          { error: "Sem permissão para visualizar esta banca" },
          { status: 403 }
        );
      }

      return NextResponse.json(banca);
    } catch (error) {
      console.error("Erro ao buscar banca:", error);
      return NextResponse.json({ error: "Erro ao buscar banca" }, { status: 500 });
    }
  }
);

export const PUT = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      const bancaExistente = await prisma.banca.findUnique({
        where: { id },
        include: {
          trabalho: true,
          membros: true,
        },
      });

      if (!bancaExistente) {
        return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
      }

      const isMembro = bancaExistente.membros.some((m) => m.usuarioId === user.userId);
      const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";

      if (!isMembro && !isAdmin) {
        return NextResponse.json(
          { error: "Sem permissão para editar esta banca" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const data = updateBancaSchema.parse(body);

      if (data.membros) {
        await prisma.membroBanca.deleteMany({
          where: { bancaId: id },
        });
      }

      const banca = await prisma.banca.update({
        where: { id },
        data: {
          ...(data.data && { data: new Date(data.data) }),
          ...(data.horario && { horario: data.horario }),
          ...(data.local && { local: data.local }),
          ...(data.modalidade && { modalidade: data.modalidade }),
          ...(data.linkReuniao !== undefined && { linkReuniao: data.linkReuniao }),
          ...(data.status && { status: data.status }),
          ...(data.notaFinal !== undefined && { notaFinal: data.notaFinal }),
          ...(data.resultado !== undefined && { resultado: data.resultado }),
          ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
          ...(data.membros && {
            membros: {
              create: data.membros.map((membro) => ({
                usuarioId: membro.usuarioId,
                papel: membro.papel,
              })),
            },
          }),
        },
        include: {
          trabalho: {
            include: {
              aluno: true,
            },
          },
          membros: {
            include: {
              usuario: true,
            },
          },
        },
      });

      return NextResponse.json(banca);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos", details: error.issues },
          { status: 400 }
        );
      }
      console.error("Erro ao atualizar banca:", error);
      return NextResponse.json({ error: "Erro ao atualizar banca" }, { status: 500 });
    }
  }
);

export const DELETE = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Sem permissão para deletar bancas" },
          { status: 403 }
        );
      }

      const banca = await prisma.banca.findUnique({
        where: { id },
      });

      if (!banca) {
        return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
      }

      if (banca.status === "REALIZADA") {
        return NextResponse.json(
          { error: "Não é possível deletar uma banca já realizada" },
          { status: 400 }
        );
      }

      await prisma.membroBanca.deleteMany({
        where: { bancaId: id },
      });

      await prisma.banca.delete({
        where: { id },
      });

      return NextResponse.json({ message: "Banca deletada com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar banca:", error);
      return NextResponse.json({ error: "Erro ao deletar banca" }, { status: 500 });
    }
  }
);
