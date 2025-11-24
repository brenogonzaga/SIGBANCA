import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { createAvaliacaoSchema } from "@/app/lib/validationSchemas";
import { z } from "zod";
import { getRequestMetadata } from "@/app/lib/requestMetadata";

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { membroId, nota, parecer, criterios } = createAvaliacaoSchema.parse(body);

    const membro = await prisma.membroBanca.findUnique({
      where: { id: membroId },
      include: {
        banca: {
          include: {
            trabalho: true,
          },
        },
        usuario: true,
        avaliacao: true,
      },
    });

    if (!membro) {
      return NextResponse.json({ error: "Membro da banca não encontrado" }, { status: 404 });
    }

    if (
      membro.usuarioId !== user.userId &&
      user.role !== "ADMIN" &&
      user.role !== "COORDENADOR"
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para criar esta avaliação" },
        { status: 403 }
      );
    }

    if (membro.avaliacao) {
      return NextResponse.json(
        { error: "Este membro já realizou sua avaliação" },
        { status: 400 }
      );
    }

    if (membro.banca.status !== "AGENDADA" && membro.banca.status !== "EM_ANDAMENTO") {
      return NextResponse.json(
        { error: `Não é possível avaliar. Status da banca: ${membro.banca.status}` },
        { status: 400 }
      );
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        membroId,
        avaliadoPorId: user.userId,
        nota,
        parecer,
        ...(criterios && {
          criterios: {
            create: criterios,
          },
        }),
      },
      include: {
        criterios: true,
        avaliadoPor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (membro.banca.status === "AGENDADA") {
      await prisma.banca.update({
        where: { id: membro.banca.id },
        data: { status: "EM_ANDAMENTO" },
      });
    }

    const { ipAddress, userAgent } = getRequestMetadata(request);

    await prisma.auditLog.create({
      data: {
        usuarioId: user.userId,
        acao: "CREATE_AVALIACAO",
        entidade: "AVALIACAO",
        entidadeId: avaliacao.id,
        ipAddress,
        userAgent,
        detalhes: {
          bancaId: membro.banca.id,
          trabalhoId: membro.banca.trabalhoId,
          nota,
        },
      },
    });

    const totalMembros = await prisma.membroBanca.count({
      where: { bancaId: membro.banca.id },
    });

    const avaliacoesCompletas = await prisma.membroBanca.count({
      where: {
        bancaId: membro.banca.id,
        avaliacao: { isNot: null },
      },
    });

    if (avaliacoesCompletas + 1 >= totalMembros) {
      const coordenadores = await prisma.usuario.findMany({
        where: {
          role: { in: ["COORDENADOR", "ADMIN"] },
          ativo: true,
        },
      });

      await prisma.notificacao.createMany({
        data: coordenadores.map((coord) => ({
          usuarioId: coord.id,
          tipo: "AVALIACOES_COMPLETAS",
          titulo: "Todas as avaliações foram enviadas",
          mensagem: `Todas as avaliações da banca do trabalho "${membro.banca.trabalho.titulo}" foram enviadas. Registre o resultado final.`,
          link: `/bancas/${membro.banca.id}`,
        })),
      });
    }

    return NextResponse.json(
      {
        message: "Avaliação criada com sucesso",
        avaliacao,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Erro ao criar avaliação:", error);
    return NextResponse.json({ error: "Erro ao criar avaliação" }, { status: 500 });
  }
});


export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const bancaId = searchParams.get("bancaId");

    if (!bancaId) {
      return NextResponse.json({ error: "ID da banca é obrigatório" }, { status: 400 });
    }

    const banca = await prisma.banca.findUnique({
      where: { id: bancaId },
      include: {
        trabalho: true,
        membros: {
          include: {
            usuario: true,
            avaliacao: {
              include: {
                criterios: true,
              },
            },
          },
        },
      },
    });

    if (!banca) {
      return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
    }

    const isMembro = banca.membros.some((m) => m.usuarioId === user.userId);
    const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";
    const isAluno = banca.trabalho.alunoId === user.userId;
    const isOrientador = banca.trabalho.orientadorId === user.userId;

    if (!isMembro && !isAdmin && !isAluno && !isOrientador) {
      return NextResponse.json(
        { error: "Você não tem permissão para visualizar estas avaliações" },
        { status: 403 }
      );
    }

    // Se for aluno ou orientador, só pode ver após banca realizada
    if ((isAluno || isOrientador) && banca.status !== "REALIZADA") {
      return NextResponse.json(
        { error: "Avaliações só ficam disponíveis após a realização da banca" },
        { status: 403 }
      );
    }

    const avaliacoes = banca.membros
      .filter((m) => m.avaliacao)
      .map((m) => ({
        id: m.avaliacao!.id,
        membro: {
          id: m.usuario.id,
          nome: m.usuario.nome,
          titulacao: m.usuario.titulacao,
          papel: m.papel,
        },
        nota: m.avaliacao!.nota,
        parecer: m.avaliacao!.parecer,
        criterios: m.avaliacao!.criterios,
        dataAvaliacao: m.avaliacao!.dataAvaliacao,
      }));

    return NextResponse.json({
      bancaId,
      avaliacoes,
      totalMembros: banca.membros.length,
      avaliacoesCompletas: avaliacoes.length,
    });
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);
    return NextResponse.json({ error: "Erro ao buscar avaliações" }, { status: 500 });
  }
});
