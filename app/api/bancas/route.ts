import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";
import { Prisma, BancaStatus } from "@prisma/client";
import { createBancaSchema } from "@/app/lib/validationSchemas";
import { z } from "zod";
import { format } from "date-fns";

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

    // Verificar se o trabalho está em um status que permite agendar banca
    const statusPermitidos = ["APROVADO_ORIENTADOR", "AGUARDANDO_BANCA"];
    if (!statusPermitidos.includes(trabalho.status)) {
      return NextResponse.json(
        {
          error: "O trabalho precisa estar aprovado pelo orientador para agendar banca",
          statusAtual: trabalho.status,
        },
        { status: 400 }
      );
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

    const dataDate = new Date(data.data);
    if (dataDate < new Date()) {
      return NextResponse.json(
        { error: "A data da banca deve ser no futuro" },
        { status: 400 }
      );
    }

    const membroIds = data.membros.map((m) => m.usuarioId);
    const uniqueIds = new Set(membroIds);
    if (membroIds.length !== uniqueIds.size) {
      return NextResponse.json(
        { error: "Um mesmo membro não pode ser adicionado múltiplas vezes" },
        { status: 400 }
      );
    }

    const startOfDay = new Date(dataDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dataDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflitos = await prisma.membroBanca.findMany({
      where: {
        usuarioId: { in: membroIds },
        banca: {
          status: { in: ["AGENDADA", "EM_ANDAMENTO"] },
          data: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      },
      include: {
        usuario: { select: { nome: true } },
        banca: { select: { horario: true, trabalhoId: true } },
      },
    });

    if (conflitos.length > 0) {
      const professoresComConflito = conflitos
        .map((c) => `${c.usuario.nome} (${c.banca.horario})`)
        .join(", ");
      return NextResponse.json(
        {
          error: "Conflito de horário detectado",
          detalhes: `Os seguintes membros já possuem banca agendada neste dia: ${professoresComConflito}`,
        },
        { status: 409 }
      );
    }

    const banca = await prisma.$transaction(async (tx) => {
      const novaBanca = await tx.banca.create({
        data: {
          trabalhoId: data.trabalhoId,
          data: dataDate,
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

      await tx.trabalho.update({
        where: { id: data.trabalhoId },
        data: { status: "BANCA_AGENDADA" },
      });

      return novaBanca;
    });

    // Notificar membros e aluno
    const notificacoes = [];

    // Notificar Aluno
    notificacoes.push({
      usuarioId: banca.trabalho.alunoId,
      tipo: "BANCA_AGENDADA",
      titulo: "Banca agendada",
      mensagem: `A banca do seu trabalho "${banca.trabalho.titulo}" foi agendada para ${data.horario} do dia ${format(dataDate, "dd/MM/yyyy")}.`,
      link: `/bancas/${banca.id}`,
    });

    // Notificar Membros (exceto quem criou a banca, se for o caso)
    banca.membros.forEach((m) => {
      if (m.usuarioId !== user.userId) {
        notificacoes.push({
          usuarioId: m.usuarioId,
          tipo: "BANCA_CRIADA",
          titulo: "Convocação para Banca",
          mensagem: `Você foi convocado como ${m.papel} para a banca do trabalho "${banca.trabalho.titulo}" em ${data.horario} do dia ${format(dataDate, "dd/MM/yyyy")}.`,
          link: `/bancas/${banca.id}`,
        });
      }
    });

    await prisma.notificacao.createMany({
      data: notificacoes,
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
