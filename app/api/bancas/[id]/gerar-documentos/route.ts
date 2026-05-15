import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { AtaDefesa } from "@/app/components/documents/AtaDefesa";
import { FolhaAprovacao } from "@/app/components/documents/FolhaAprovacao";
import { uploadFile } from "@/app/lib/minio";

export const POST = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      // 1. Buscar dados completos da banca
      const banca = await prisma.banca.findUnique({
        where: { id },
        include: {
          trabalho: {
            include: {
              aluno: true,
              orientador: true,
            },
          },
          membros: {
            include: {
              usuario: true,
              avaliacao: true,
            },
          },
        },
      });

      if (!banca) {
        return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
      }

      // Verificar permissão (Apenas orientador, coordenador ou admin)
      const isOrientador = banca.trabalho.orientadorId === user.userId;
      const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";

      if (!isOrientador && !isAdmin) {
        return NextResponse.json(
          { error: "Sem permissão para gerar documentos desta banca" },
          { status: 403 }
        );
      }

      if (banca.status !== "REALIZADA" || !banca.notaFinal) {
        return NextResponse.json(
          { error: "A banca precisa estar marcada como REALIZADA e possuir nota final para gerar os documentos" },
          { status: 400 }
        );
      }

      // 2. Preparar dados para os documentos
      const dadosComuns = {
        instituicao: "Instituto Federal de Educação, Ciência e Tecnologia do Amazonas",
        campus: "Campus Manaus Centro", // Poderia vir de configuração do sistema
        curso: banca.trabalho.curso,
        aluno: banca.trabalho.aluno.nome,
        tituloTrabalho: banca.trabalho.titulo,
        data: banca.data.toLocaleDateString("pt-BR"),
        horario: banca.horario,
        local: banca.local,
        membros: banca.membros.map((m) => ({
          nome: m.usuario.nome,
          papel: m.papel,
          nota: m.avaliacao?.nota || undefined,
          instituicao: m.usuario.departamento || "IFAM",
        })),
        notaFinal: banca.notaFinal,
        resultado: banca.resultado || "APROVADO",
      };

      // 3. Gerar Ata de Defesa
      const ataElement = React.createElement(AtaDefesa, { dados: dadosComuns });
      const ataBuffer = await renderToBuffer(ataElement);
      const ataPath = `bancas/${id}/ata_defesa_${Date.now()}.pdf`;
      const ataUrl = await uploadFile(ataPath, ataBuffer);

      // 4. Gerar Folha de Aprovação
      const folhaElement = React.createElement(FolhaAprovacao, { 
        dados: {
          ...dadosComuns,
          titulo: banca.trabalho.titulo,
          dataDefesa: dadosComuns.data,
          instituicao: dadosComuns.instituicao
        } 
      });
      const folhaBuffer = await renderToBuffer(folhaElement);
      const folhaPath = `bancas/${id}/folha_aprovacao_${Date.now()}.pdf`;
      const folhaUrl = await uploadFile(folhaPath, folhaBuffer);

      // 5. Atualizar Banca com as URLs
      const bancaAtualizada = await prisma.banca.update({
        where: { id },
        data: {
          ataUrl,
          folhaAprovacaoUrl: folhaUrl,
        },
      });

      // 6. Registrar Log de Auditoria
      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          acao: "GENERATE_DOCUMENTS",
          entidade: "BANCA",
          entidadeId: id,
          detalhes: {
            ataUrl,
            folhaUrl,
          },
        },
      });

      return NextResponse.json({
        message: "Documentos gerados com sucesso",
        ataUrl,
        folhaAprovacaoUrl: folhaUrl,
      });
    } catch (error) {
      console.error("Erro ao gerar documentos:", error);
      return NextResponse.json({ error: "Erro ao gerar documentos" }, { status: 500 });
    }
  }
);
