"use server";

import { headers } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";

export async function assinarDocumento(
  usuarioId: string,
  tipoDocumento: string,
  entidadeId: string,
  documentoConteudo: string
) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "0.0.0.0";
    const dataHora = new Date();

    // Gerar um hash criptográfico dos dados da assinatura
    const rawData = `${usuarioId}|${tipoDocumento}|${entidadeId}|${dataHora.toISOString()}|${documentoConteudo}|${ipAddress}`;
    const hashAssinatura = crypto.createHash("sha256").update(rawData).digest("hex");

    const assinatura = await prisma.assinaturaEletronica.create({
      data: {
        usuarioId,
        tipoDocumento, // ex: 'FICHA_GERAL', 'TERMO_APROVACAO', 'TERMO_AUTORIZACAO'
        entidadeId,
        hashAssinatura,
        ipAddress,
        dataHora,
      },
    });

    return { success: true, assinatura };
  } catch (error) {
    console.error("Erro ao assinar documento:", error);
    return { success: false, error: "Falha ao gerar assinatura eletrônica." };
  }
}

export async function verificarAssinatura(hashAssinatura: string) {
  try {
    const assinatura = await prisma.assinaturaEletronica.findFirst({
      where: { hashAssinatura },
      include: {
        usuario: {
          select: { nome: true, email: true, cpf: true }
        }
      }
    });

    if (!assinatura) {
      return { success: false, error: "Assinatura não encontrada." };
    }

    return { success: true, assinatura };
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return { success: false, error: "Falha ao verificar assinatura eletrônica." };
  }
}
