import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);

    if (!payload || (payload.role !== "ADMIN" && payload.role !== "COORDENADOR")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const configuracoes = await prisma.configuracaoSistema.findMany();
    return NextResponse.json(configuracoes);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyToken(token);

    if (!payload || (payload.role !== "ADMIN" && payload.role !== "COORDENADOR")) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const data = await req.json();
    const { chave, valor } = data;

    if (!chave || valor === undefined) {
      return NextResponse.json(
        { error: "Chave e valor são obrigatórios" },
        { status: 400 }
      );
    }

    const configuracao = await prisma.configuracaoSistema.upsert({
      where: { chave },
      update: { valor: String(valor) },
      create: { 
        chave, 
        valor: String(valor),
        descricao: data.descricao || ""
      },
    });

    // Auditoria
    await prisma.auditLog.create({
      data: {
        usuarioId: payload.userId,
        acao: "UPDATE",
        entidade: "ConfiguracaoSistema",
        detalhes: { chave, novoValor: valor },
      },
    });

    return NextResponse.json(configuracao);
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
