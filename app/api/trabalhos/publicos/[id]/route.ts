import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { publicApiRateLimit } from "@/app/lib/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return publicApiRateLimit(request, async () => {
    try {
      const { id } = await params;

      const trabalho = await prisma.trabalho.findUnique({
        where: {
          id,
          status: "APROVADO", // Apenas trabalhos aprovados são públicos
        },
        select: {
          id: true,
          titulo: true,
          descricao: true,
          palavrasChave: true,
          curso: true,
          status: true,
          dataDefesa: true,
          createdAt: true,
          aluno: {
            select: {
              id: true,
              nome: true,
              curso: true,
              matricula: true,
            },
          },
          orientador: {
            select: {
              id: true,
              nome: true,
              titulacao: true,
              departamento: true,
              lattes: true,
            },
          },
          versoes: {
            orderBy: { numeroVersao: "desc" },
            take: 1,
            select: {
              id: true,
              numeroVersao: true,
              nomeArquivo: true,
              tipoDocumento: true,
              urlExterna: true,
              plataforma: true,
              tituloDocumento: true,
              tamanho: true,
              dataUpload: true,
            },
          },
          banca: {
            select: {
              id: true,
              data: true,
              horario: true,
              local: true,
              modalidade: true,
              notaFinal: true,
              resultado: true,
              membros: {
                select: {
                  id: true,
                  papel: true,
                  usuario: {
                    select: {
                      id: true,
                      nome: true,
                      titulacao: true,
                      departamento: true,
                      lattes: true,
                    },
                  },
                  avaliacao: {
                    select: {
                      parecer: true,
                      nota: true,
                      dataAvaliacao: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!trabalho) {
        return NextResponse.json(
          { error: "Trabalho não encontrado ou não disponível publicamente" },
          { status: 404 }
        );
      }

      return NextResponse.json(trabalho);
    } catch (error) {
      console.error("Erro ao buscar trabalho público:", error);
      return NextResponse.json({ error: "Erro ao buscar trabalho" }, { status: 500 });
    }
  });
}
