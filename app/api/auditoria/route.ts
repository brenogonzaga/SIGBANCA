import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas coordenadores e administradores podem acessar logs de auditoria" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const acao = searchParams.get("acao");
    const entidade = searchParams.get("entidade");
    const usuarioId = searchParams.get("usuarioId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");

    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (acao) {
      where.acao = acao;
    }

    if (entidade) {
      where.entidade = entidade;
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (dataInicio || dataFim) {
      where.createdAt = {};
      if (dataInicio) {
        where.createdAt.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.createdAt.lte = new Date(dataFim);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const acoesPorTipo = await prisma.auditLog.groupBy({
      by: ["acao"],
      _count: { acao: true },
      orderBy: { _count: { acao: "desc" } },
      take: 10,
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      estatisticas: {
        acoesPorTipo: acoesPorTipo.map((item) => ({
          acao: item.acao,
          quantidade: item._count.acao,
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error);
    return NextResponse.json({ error: "Erro ao buscar logs de auditoria" }, { status: 500 });
  }
});
