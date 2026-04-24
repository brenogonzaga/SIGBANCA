import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";
import { Prisma, UserRole } from "@prisma/client";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const ativo = searchParams.get("ativo");

    const where: Prisma.UsuarioWhereInput = {
      deletedAt: null,
    };

    if (role) {
      const roles = role.split(",").map((r) => r.trim());
      if (roles.length === 1) {
        where.role = roles[0] as UserRole;
      } else {
        where.role = { in: roles as UserRole[] };
      }
    }

    if (ativo !== null) {
      where.ativo = ativo === "true";
    }

    if (user.role === "ALUNO") {
      if (role !== "PROFESSOR") {
        return NextResponse.json(
          { error: "Alunos só podem visualizar professores" },
          { status: 403 },
        );
      }
      where.role = "PROFESSOR";
    } else if (user.role === "PROFESSOR") {
      const rolesPermitidas = ["ALUNO", "PROFESSOR", "PROFESSOR_BANCA"];
      const rolesRequest = role ? role.split(",").map((r) => r.trim()) : [];
      const roleInvalida = rolesRequest.find((r) => !rolesPermitidas.includes(r));
      if (roleInvalida || rolesRequest.length === 0) {
        return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
      }
      if (rolesRequest.length > 1) {
        where.role = { in: rolesRequest as UserRole[] };
      } else {
        where.role = rolesRequest[0] as UserRole;
      }
    } else if (user.role !== "ADMIN" && user.role !== "COORDENADOR") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (user.role === "COORDENADOR") {
      where.role = { not: "ADMIN" };
    }

    const usuarios = await prisma.usuario.findMany({
      where,
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
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
});
