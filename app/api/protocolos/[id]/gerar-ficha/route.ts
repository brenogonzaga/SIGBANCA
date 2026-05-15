import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { FichaCatalografica } from "@/app/components/documents/FichaCatalografica";
import { uploadFile } from "@/app/lib/minio";

export const POST = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { cutter, cdd, bibliotecario, crb } = body;

      const protocolo = await prisma.protocolo.findUnique({
        where: { id },
        include: {
          aluno: true,
          trabalho: {
            include: { orientador: true }
          }
        }
      });

      if (!protocolo || protocolo.tipo !== "FICHA_CATALOGRAFICA") {
        return NextResponse.json({ error: "Protocolo inválido" }, { status: 400 });
      }

      // 1. Preparar dados para a ficha
      // Formatar nome do autor: Último nome, Primeiros nomes
      const nomes = protocolo.aluno.nome.split(" ");
      const ultimoNome = nomes.pop();
      const autorFormatoFicha = `${ultimoNome}, ${nomes.join(" ")}`;

      const dadosFicha = {
        autor: autorFormatoFicha,
        titulo: protocolo.trabalho.titulo,
        orientador: `Prof. Dr. ${protocolo.trabalho.orientador.nome}`,
        ano: new Date().getFullYear().toString(),
        paginas: "138", // Poderia vir de um campo do protocolo
        curso: protocolo.trabalho.curso,
        campus: "Campus Manaus Centro",
        palavrasChave: protocolo.trabalho.palavrasChave || ["TCC", "IFAM"],
        cutter: cutter || "S729m",
        cdd: cdd || "005.3",
        bibliotecario: bibliotecario || user.nome,
        crb: crb || "CRB 11/597"
      };

      // 2. Gerar PDF
      const element = React.createElement(FichaCatalografica, { dados: dadosFicha });
      const buffer = await renderToBuffer(element);
      
      // 3. Upload para MinIO
      const path = `protocolos/fichas/${id}_ficha_${Date.now()}.pdf`;
      const { url } = await uploadFile(buffer, path);

      return NextResponse.json({ url });
    } catch (error: any) {
      console.error("Erro ao gerar ficha:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
);
