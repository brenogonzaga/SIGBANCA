import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/auth";
import { UserRole } from "@prisma/client";
import { VALIDATION_CONFIG } from "@/app/config";
import { getRequestMetadata } from "@/app/lib/requestMetadata";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z
    .string()
    .min(
      VALIDATION_CONFIG.USUARIO.SENHA.MIN,
      `Senha deve ter no mínimo ${VALIDATION_CONFIG.USUARIO.SENHA.MIN} caracteres`
    ),
  nome: z
    .string()
    .min(
      VALIDATION_CONFIG.USUARIO.NOME.MIN,
      `Nome deve ter no mínimo ${VALIDATION_CONFIG.USUARIO.NOME.MIN} caracteres`
    ),
  role: z.enum(["ALUNO", "PROFESSOR", "COORDENADOR", "PROFESSOR_BANCA", "ADMIN"]),

  cpf: z.string().optional(),
  telefone: z.string().optional(),
  matricula: z.string().optional(),
  curso: z.string().optional(),
  titulacao: z.string().optional(),
  departamento: z.string().optional(),
  areaAtuacao: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = signupSchema.parse(body);

    const existingUser = await prisma.usuario.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
    }

    if (data.matricula) {
      const existingMatricula = await prisma.usuario.findUnique({
        where: { matricula: data.matricula },
      });

      if (existingMatricula) {
        return NextResponse.json({ error: "Matrícula já cadastrada" }, { status: 400 });
      }
    }

    const senhaHash = await hashPassword(data.senha);

    const usuario = await prisma.usuario.create({
      data: {
        email: data.email,
        senha: senhaHash,
        nome: data.nome,
        role: data.role as UserRole,
        cpf: data.cpf,
        telefone: data.telefone,
        matricula: data.matricula,
        curso: data.curso,
        titulacao: data.titulacao,
        departamento: data.departamento,
        areaAtuacao: data.areaAtuacao,
        dataIngresso: data.role === "ALUNO" ? new Date() : undefined,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        matricula: true,
        curso: true,
        createdAt: true,
      },
    });

    const { ipAddress, userAgent } = getRequestMetadata(request);

    await prisma.auditLog.create({
      data: {
        usuarioId: usuario.id,
        acao: "CREATE",
        entidade: "USUARIO",
        entidadeId: usuario.id,
        ipAddress,
        userAgent,
        detalhes: {
          evento: "Cadastro realizado",
          role: usuario.role,
        },
      },
    });

    return NextResponse.json(
      {
        message: "Usuário cadastrado com sucesso",
        usuario,
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

    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: "Erro ao cadastrar usuário" }, { status: 500 });
  }
}
