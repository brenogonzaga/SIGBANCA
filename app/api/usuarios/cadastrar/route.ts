import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";
import { hashPassword } from "@/app/lib/auth";
import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";
import { VALIDATION_CONFIG } from "@/app/config";
import { getRequestMetadata } from "@/app/lib/requestMetadata";

const createUsuarioSchema = z.object({
  email: z.email("Email inválido"),
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
  lattes: z.string().optional(),
  dataIngresso: z.string().optional(),
});

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const validatedData = createUsuarioSchema.parse(body);

    // Verificar permissões
    // ADMIN pode cadastrar qualquer usuário
    // COORDENADOR pode cadastrar ALUNO e PROFESSOR
    // PROFESSOR pode cadastrar apenas ALUNO

    const canCreate = canUserCreateRole(user.role, validatedData.role as UserRole);

    if (!canCreate) {
      return NextResponse.json(
        {
          error: `Você não tem permissão para cadastrar usuários do tipo ${validatedData.role}`,
        },
        { status: 403 }
      );
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado no sistema" }, { status: 400 });
    }

    const senhaHash = await hashPassword(validatedData.senha);

    const usuarioData: Prisma.UsuarioCreateInput = {
      email: validatedData.email,
      senha: senhaHash,
      nome: validatedData.nome,
      role: validatedData.role as UserRole,
      cpf: validatedData.cpf,
      telefone: validatedData.telefone,
      ativo: true,
    };

    if (validatedData.role === "ALUNO") {
      usuarioData.matricula = validatedData.matricula;
      usuarioData.curso = validatedData.curso;
      if (validatedData.dataIngresso) {
        usuarioData.dataIngresso = new Date(validatedData.dataIngresso);
      }
    }

    if (["PROFESSOR", "COORDENADOR", "PROFESSOR_BANCA"].includes(validatedData.role)) {
      usuarioData.titulacao = validatedData.titulacao;
      usuarioData.departamento = validatedData.departamento;
      usuarioData.areaAtuacao = validatedData.areaAtuacao;
      usuarioData.lattes = validatedData.lattes;
    }

    const novoUsuario = await prisma.usuario.create({
      data: usuarioData,
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        cpf: true,
        telefone: true,
        matricula: true,
        curso: true,
        titulacao: true,
        departamento: true,
        areaAtuacao: true,
        ativo: true,
        createdAt: true,
      },
    });

    const { ipAddress, userAgent } = getRequestMetadata(request);

    await prisma.auditLog.create({
      data: {
        usuarioId: user.userId,
        acao: "CREATE",
        entidade: "Usuario",
        entidadeId: novoUsuario.id,
        ipAddress,
        userAgent,
        detalhes: {
          descricao: `Usuário ${novoUsuario.nome} (${novoUsuario.role}) cadastrado por ${user.nome}`,
        },
      },
    });

    await prisma.notificacao.create({
      data: {
        usuarioId: novoUsuario.id,
        tipo: "SISTEMA",
        titulo: "Bem-vindo ao SIGBANCA",
        mensagem: `Seu cadastro foi realizado com sucesso. Use seu email ${novoUsuario.email} para fazer login.`,
        lida: false,
      },
    });

    return NextResponse.json(
      {
        message: "Usuário cadastrado com sucesso",
        usuario: novoUsuario,
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

    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Erro ao cadastrar usuário" }, { status: 500 });
  }
});

function canUserCreateRole(userRole: UserRole, targetRole: UserRole): boolean {
  const permissions: Record<UserRole, UserRole[]> = {
    ADMIN: ["ADMIN", "COORDENADOR", "PROFESSOR", "PROFESSOR_BANCA", "ALUNO"],
    COORDENADOR: ["PROFESSOR", "ALUNO"],
    PROFESSOR: ["ALUNO"],
    PROFESSOR_BANCA: [],
    ALUNO: [],
  };

  return permissions[userRole]?.includes(targetRole) || false;
}
