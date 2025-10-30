import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";
import { Prisma, TrabalhoStatus } from "@prisma/client";
import { z } from "zod";

const createTrabalhoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  curso: z.string().min(1, "Curso é obrigatório"),
  alunoId: z.string(),
  orientadorId: z.string(),
  dataInicio: z.string(),
  previsaoTermino: z.string().optional(),
  palavrasChave: z.string().optional(),
  resumo: z.string().optional(),
});

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const alunoId = searchParams.get("alunoId");
    const orientadorId = searchParams.get("orientadorId");

    const where: Prisma.TrabalhoWhereInput = {};

    if (status) {
      where.status = status as TrabalhoStatus;
    }

    if (alunoId) {
      where.alunoId = alunoId;
    }

    if (orientadorId) {
      where.orientadorId = orientadorId;
    }

    if (user.role === "ALUNO") {
      where.alunoId = user.userId;
    } else if (user.role === "PROFESSOR") {
      where.orientadorId = user.userId;
    }

    const trabalhos = await prisma.trabalho.findMany({
      where,
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
        versoes: {
          orderBy: { numeroVersao: "desc" },
          take: 1,
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
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trabalhos);
  } catch (error) {
    console.error("Erro ao buscar trabalhos:", error);
    return NextResponse.json({ error: "Erro ao buscar trabalhos" }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.role !== "ALUNO" && user.role !== "COORDENADOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão para criar trabalho" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTrabalhoSchema.parse(body);
    const alunoId = user.role === "ALUNO" ? user.userId : validatedData.alunoId;

    const trabalhoExistente = await prisma.trabalho.findFirst({
      where: {
        alunoId,
        status: {
          notIn: ["CANCELADO", "REPROVADO"],
        },
      },
    });

    if (trabalhoExistente) {
      return NextResponse.json({ error: "Aluno já possui trabalho ativo" }, { status: 400 });
    }

    const orientador = await prisma.usuario.findUnique({
      where: { id: validatedData.orientadorId },
    });

    if (!orientador || orientador.role !== "PROFESSOR") {
      return NextResponse.json({ error: "Orientador inválido" }, { status: 400 });
    }

    const trabalho = await prisma.trabalho.create({
      data: {
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        curso: validatedData.curso,
        alunoId,
        orientadorId: validatedData.orientadorId,
        dataInicio: new Date(validatedData.dataInicio),
        status: "EM_ELABORACAO",
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

    return NextResponse.json(trabalho, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Erro ao criar trabalho:", error);
    return NextResponse.json({ error: "Erro ao criar trabalho" }, { status: 500 });
  }
});
