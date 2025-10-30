import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";
import { Prisma, BancaStatus } from "@prisma/client";
import { z } from "zod";

const createBancaSchema = z.object({
  trabalhoId: z.string(),
  data: z.string(),
  horario: z.string(),
  local: z.string(),
  modalidade: z.enum(["PRESENCIAL", "REMOTO", "HIBRIDO"]),
  linkReuniao: z.string().optional(),
  membros: z.array(
    z.object({
      usuarioId: z.string(),
      papel: z.enum(["ORIENTADOR", "AVALIADOR", "SUPLENTE"]),
    })
  ),
});

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const where: Prisma.BancaWhereInput = {};

    if (status) {
      where.status = status as BancaStatus;
    }

    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) {
        where.data.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.data.lte = new Date(dataFim);
      }
    }

    if (user.role === "ALUNO") {
      where.trabalho = { alunoId: user.userId };
    } else if (user.role === "PROFESSOR" || user.role === "PROFESSOR_BANCA") {
      where.membros = {
        some: {
          usuarioId: user.userId,
        },
      };
    }

    const bancas = await prisma.banca.findMany({
      where,
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
      orderBy: { data: "desc" },
    });

    return NextResponse.json(bancas);
  } catch (error) {
    console.error("Erro ao buscar bancas:", error);
    return NextResponse.json({ error: "Erro ao buscar bancas" }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão para criar bancas" }, { status: 403 });
    }

    const body = await request.json();
    const data = createBancaSchema.parse(body);

    const trabalho = await prisma.trabalho.findUnique({
      where: { id: data.trabalhoId },
    });

    if (!trabalho) {
      return NextResponse.json({ error: "Trabalho não encontrado" }, { status: 404 });
    }

    const bancaExistente = await prisma.banca.findFirst({
      where: {
        trabalhoId: data.trabalhoId,
        status: { in: ["AGENDADA", "EM_ANDAMENTO"] },
      },
    });

    if (bancaExistente) {
      return NextResponse.json(
        { error: "Já existe uma banca agendada para este trabalho" },
        { status: 400 }
      );
    }

    const banca = await prisma.banca.create({
      data: {
        trabalhoId: data.trabalhoId,
        data: new Date(data.data),
        horario: data.horario,
        local: data.local,
        modalidade: data.modalidade,
        linkReuniao: data.linkReuniao,
        status: "AGENDADA",
        membros: {
          create: data.membros.map((membro) => ({
            usuarioId: membro.usuarioId,
            papel: membro.papel,
          })),
        },
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

    return NextResponse.json(banca, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Erro ao criar banca:", error);
    return NextResponse.json({ error: "Erro ao criar banca" }, { status: 500 });
  }
});
