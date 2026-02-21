import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const broadcastSchema = z.object({
  titulo: z.string().min(3, "Título muito curto"),
  mensagem: z.string().min(5, "Mensagem muito curta"),
  tipo: z.string().default("INFO"),
  link: z.string().optional(),
  target: z.enum(["ALL", "ROLE", "USERS"]),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  users: z.array(z.string()).optional(),
});

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão para enviar broadcast" }, { status: 403 });
    }

    const body = await request.json();
    const data = broadcastSchema.parse(body);

    let targetUsers: string[] = [];

    if (data.target === "ALL") {
      const allUsers = await prisma.usuario.findMany({
        where: { ativo: true },
        select: { id: true },
      });
      targetUsers = allUsers.map((u) => u.id);
    } else if (data.target === "ROLE" && data.roles) {
      const usersByRole = await prisma.usuario.findMany({
        where: {
          role: { in: data.roles },
          ativo: true,
        },
        select: { id: true },
      });
      targetUsers = usersByRole.map((u) => u.id);
    } else if (data.target === "USERS" && data.users) {
      targetUsers = data.users;
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "Nenhum destinatário encontrado" }, { status: 400 });
    }

    // Criar notificações em massa
    await prisma.notificacao.createMany({
      data: targetUsers.map((userId) => ({
        usuarioId: userId,
        titulo: data.titulo,
        mensagem: data.mensagem,
        tipo: data.tipo,
        link: data.link,
      })),
    });

    return NextResponse.json({
      message: `Notificação enviada com sucesso para ${targetUsers.length} usuários.`,
      count: targetUsers.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    console.error("Erro ao enviar broadcast:", error);
    return NextResponse.json({ error: "Erro interno ao processar broadcast" }, { status: 500 });
  }
});
