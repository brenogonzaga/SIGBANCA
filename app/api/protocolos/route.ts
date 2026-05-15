import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { z } from "zod";
import { uploadFile } from "@/app/lib/minio";

const createProtocoloSchema = z.object({
  tipo: z.enum(["FICHA_CATALOGRAFICA", "NADA_CONSTA", "ENTREGA_VERSAO_FINAL"]),
  trabalhoId: z.string(),
  observacoes: z.string().optional(),
});

export const GET = withAuthContext(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tipo = searchParams.get("tipo");

    const where: any = {};
    
    // Filtros por papel
    if (user.role === "ALUNO") {
      where.alunoId = user.userId;
    } else if (user.role === "BIBLIOTECARIO") {
      where.tipo = "FICHA_CATALOGRAFICA";
    } else if (user.role === "COORDENADOR" || user.role === "ADMIN") {
      // Vê tudo
    } else {
      // Professores vêem protocolos vinculados aos seus orientandos
      where.trabalho = {
        orientadorId: user.userId
      };
    }

    if (status) where.status = status;
    if (tipo) where.tipo = tipo;

    const protocolos = await prisma.protocolo.findMany({
      where,
      include: {
        aluno: {
          select: { nome: true, email: true, matricula: true, curso: true }
        },
        trabalho: {
          select: { titulo: true, curso: true }
        },
        responsavel: {
          select: { nome: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(protocolos);
  } catch (error) {
    console.error("Erro ao buscar protocolos:", error);
    return NextResponse.json({ error: "Erro ao buscar protocolos" }, { status: 500 });
  }
});

export const POST = withAuthContext(async (request, user) => {
  try {
    if (user.role !== "ALUNO") {
      return NextResponse.json({ error: "Apenas alunos podem abrir protocolos" }, { status: 403 });
    }

    const formData = await request.formData();
    const tipo = formData.get("tipo") as any;
    const trabalhoId = formData.get("trabalhoId") as string;
    const observacoes = formData.get("observacoes") as string;
    const arquivo = formData.get("arquivo") as File;

    // Validar se o trabalho pertence ao aluno
    const trabalho = await prisma.trabalho.findFirst({
      where: { id: trabalhoId, alunoId: user.userId }
    });

    if (!trabalho) {
      return NextResponse.json({ error: "Trabalho não encontrado ou sem permissão" }, { status: 404 });
    }

    let arquivoEnviadoUrl = null;
    if (arquivo) {
      const path = `protocolos/${user.userId}/${Date.now()}_${arquivo.name}`;
      const { url } = await uploadFile(arquivo, path);
      arquivoEnviadoUrl = url;
    }

    const protocolo = await prisma.protocolo.create({
      data: {
        tipo,
        trabalhoId,
        alunoId: user.userId,
        observacoes,
        arquivoEnviadoUrl,
        status: "ABERTO"
      }
    });

    // Notificar bibliotecários se for Ficha Catalográfica
    if (tipo === "FICHA_CATALOGRAFICA") {
      const bibliotecarios = await prisma.usuario.findMany({
        where: { role: "BIBLIOTECARIO" }
      });

      await Promise.all(bibliotecarios.map(bib => 
        prisma.notificacao.create({
          data: {
            usuarioId: bib.id,
            tipo: "PROTOCOLO_ABERTO",
            titulo: "Nova Solicitação de Ficha Catalográfica",
            mensagem: `O aluno ${user.nome} solicitou uma ficha para o trabalho "${trabalho.titulo}".`,
            link: `/protocolos/${protocolo.id}`
          }
        })
      ));
    }

    return NextResponse.json(protocolo);
  } catch (error) {
    console.error("Erro ao criar protocolo:", error);
    return NextResponse.json({ error: "Erro ao criar protocolo" }, { status: 500 });
  }
});
