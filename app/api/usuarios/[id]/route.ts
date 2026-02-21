import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateUsuarioSchema = z.object({
  nome: z.string().optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6).optional(),
  matricula: z.string().optional(),
  curso: z.string().optional(),
  dataIngresso: z.string().optional(),
  titulacao: z.string().optional(),
  departamento: z.string().optional(),
  areaAtuacao: z.string().optional(),
  lattes: z.string().optional(),
});

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      if (user.role !== "ADMIN" && user.role !== "COORDENADOR" && user.userId !== id) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }

      const usuario = await prisma.usuario.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          nome: true,
          cpf: true,
          telefone: true,
          role: true,
          ativo: true,
          matricula: true,
          curso: true,
          dataIngresso: true,
          titulacao: true,
          departamento: true,
          areaAtuacao: true,
          lattes: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!usuario) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      }

      return NextResponse.json(usuario);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 });
    }
  }
);

export const PUT = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      if (user.role !== "ADMIN" && user.role !== "COORDENADOR" && user.userId !== id) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }

      const body = await request.json();
      const data = updateUsuarioSchema.parse(body);

      const updateData: Record<string, unknown> = { ...data };

      if (data.senha) {
        updateData.senha = await bcrypt.hash(data.senha, 10);
      }

      if (data.dataIngresso) {
        updateData.dataIngresso = new Date(data.dataIngresso);
      }

      const usuario = await prisma.usuario.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          nome: true,
          cpf: true,
          telefone: true,
          role: true,
          ativo: true,
          matricula: true,
          curso: true,
          dataIngresso: true,
          titulacao: true,
          departamento: true,
          areaAtuacao: true,
          lattes: true,
          updatedAt: true,
        },
      });

      return NextResponse.json(usuario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos", details: error.issues },
          { status: 400 }
        );
      }

      console.error("Erro ao atualizar usuário:", error);
      return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 });
    }
  }
);

export const DELETE = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }

      if (user.userId === id) {
        return NextResponse.json(
          { error: "Você não pode deletar sua própria conta" },
          { status: 400 }
        );
      }

      const usuario = await prisma.usuario.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: { nome: true },
      });

      if (!usuario) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      }

      await prisma.usuario.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          ativo: false,
        },
      });

      return NextResponse.json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return NextResponse.json({ error: "Erro ao deletar usuário" }, { status: 500 });
    }
  }
);
