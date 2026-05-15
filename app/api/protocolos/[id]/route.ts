import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { uploadFile } from "@/app/lib/minio";

export const GET = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;
      const protocolo = await prisma.protocolo.findUnique({
        where: { id },
        include: {
          aluno: true,
          trabalho: true,
          responsavel: true,
        }
      });

      if (!protocolo) {
        return NextResponse.json({ error: "Protocolo não encontrado" }, { status: 404 });
      }

      // Verificação básica de permissão
      const isOwner = protocolo.alunoId === user.userId;
      const isStaff = user.role === "BIBLIOTECARIO" || user.role === "COORDENADOR" || user.role === "ADMIN";
      
      if (!isOwner && !isStaff) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
      }

      return NextResponse.json(protocolo);
    } catch (error) {
      return NextResponse.json({ error: "Erro ao buscar protocolo" }, { status: 500 });
    }
  }
);

export const PATCH = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;
      const formData = await request.formData();
      const status = formData.get("status") as any;
      const observacoes = formData.get("observacoes") as string;
      const arquivoRetorno = formData.get("arquivoRetorno") as File;

      const protocoloExistente = await prisma.protocolo.findUnique({
        where: { id }
      });

      if (!protocoloExistente) {
        return NextResponse.json({ error: "Protocolo não encontrado" }, { status: 404 });
      }

      // Apenas staff pode atualizar status e enviar retorno
      const isStaff = user.role === "BIBLIOTECARIO" || user.role === "COORDENADOR" || user.role === "ADMIN";
      if (!isStaff) {
        return NextResponse.json({ error: "Sem permissão para processar protocolos" }, { status: 403 });
      }

      let arquivoRetornoUrl = undefined;
      if (arquivoRetorno) {
        const buffer = Buffer.from(await arquivoRetorno.arrayBuffer());
        const path = `protocolos/retorno/${id}_${Date.now()}_${arquivoRetorno.name}`;
        arquivoRetornoUrl = await uploadFile(path, buffer);
      }

      const protocolo = await prisma.protocolo.update({
        where: { id },
        data: {
          status: status || undefined,
          observacoes: observacoes || undefined,
          arquivoRetornoUrl,
          responsavelId: user.userId,
          dataFechamento: (status === "DEFERIDO" || status === "INDEFERIDO") ? new Date() : undefined,
        },
        include: { aluno: true }
      });

      // Notificar o aluno
      await prisma.notificacao.create({
        data: {
          usuarioId: protocolo.alunoId,
          tipo: "PROTOCOLO_ATUALIZADO",
          titulo: `Protocolo ${protocolo.status}`,
          mensagem: `Seu protocolo de ${protocolo.tipo} foi atualizado para o status: ${protocolo.status}.`,
          link: `/protocolos`
        }
      });

      return NextResponse.json(protocolo);
    } catch (error) {
      console.error("Erro ao atualizar protocolo:", error);
      return NextResponse.json({ error: "Erro ao atualizar protocolo" }, { status: 500 });
    }
  }
);
