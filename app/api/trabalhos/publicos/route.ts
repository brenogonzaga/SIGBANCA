import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { publicApiRateLimit } from "@/app/lib/rateLimit";

export async function GET(request: NextRequest) {
  return publicApiRateLimit(request, async () => {
    try {
      const { searchParams } = new URL(request.url);
      const curso = searchParams.get("curso");
      const palavraChave = searchParams.get("palavraChave");
      const ano = searchParams.get("ano");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {
        status: "APROVADO",
      };

      if (curso) {
        where.curso = curso;
      }

      if (palavraChave) {
        where.palavrasChave = {
          has: palavraChave,
        };
      }

      if (ano) {
        const anoNum = parseInt(ano);
        where.dataDefesa = {
          gte: new Date(`${anoNum}-01-01`),
          lte: new Date(`${anoNum}-12-31`),
        };
      }

      const trabalhos = await prisma.trabalho.findMany({
        where,
        orderBy: {
          dataDefesa: "desc",
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
            },
          },
          orientador: {
            select: {
              id: true,
              nome: true,
              titulacao: true,
            },
          },
          versoes: {
            orderBy: {
              numeroVersao: "desc",
            },
            take: 1,
            select: {
              id: true,
              numeroVersao: true,
              nomeArquivo: true,
              dataUpload: true,
            },
          },
          banca: {
            select: {
              id: true,
              data: true,
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
                    },
                  },
                },
              },
            },
          },
        },
      });

      return NextResponse.json(trabalhos);
    } catch (error) {
      console.error("Erro ao buscar trabalhos públicos:", error);
      return NextResponse.json({ error: "Erro ao buscar trabalhos" }, { status: 500 });
    }
  });
}
