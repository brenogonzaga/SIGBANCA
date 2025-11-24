import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";
import { verifyPassword, generateToken } from "@/app/lib/auth";
import { authRateLimit } from "@/app/lib/rateLimit";
import { getRequestMetadata } from "@/app/lib/requestMetadata";

const loginSchema = z.object({
  email: z.email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(request: NextRequest) {
  return authRateLimit(request, async () => {
    try {
      const body = await request.json();
      const data = loginSchema.parse(body);

      const usuario = await prisma.usuario.findFirst({
        where: {
          email: data.email,
          deletedAt: null,
        },
      });

      if (!usuario) {
        return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
      }

      if (!usuario.ativo) {
        return NextResponse.json(
          { error: "Usuário inativo. Contate o administrador." },
          { status: 403 }
        );
      }

      const senhaValida = await verifyPassword(data.senha, usuario.senha);

      if (!senhaValida) {
        return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
      }

      const token = generateToken({
        userId: usuario.id,
        email: usuario.email,
        role: usuario.role,
        nome: usuario.nome,
      });

      const { ipAddress, userAgent } = getRequestMetadata(request);

      await prisma.auditLog.create({
        data: {
          usuarioId: usuario.id,
          acao: "LOGIN",
          entidade: "USUARIO",
          entidadeId: usuario.id,
          ipAddress,
          userAgent,
          detalhes: {
            evento: "Login realizado",
          },
        },
      });

      return NextResponse.json({
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          role: usuario.role,
          matricula: usuario.matricula,
          curso: usuario.curso,
          titulacao: usuario.titulacao,
          departamento: usuario.departamento,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos", details: error.issues },
          { status: 400 }
        );
      }

      console.error("Erro no login:", error);
      return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
    }
  });
}
