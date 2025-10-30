import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";

export const GET = withAuth(async () => {
  try {
    const totalTrabalhos = await prisma.trabalho.count();
    const trabalhosEmRevisao = await prisma.trabalho.count({
      where: { status: "EM_REVISAO" },
    });
    const trabalhosAprovados = await prisma.trabalho.count({
      where: { status: "APROVADO" },
    });
    const bancasAgendadas = await prisma.banca.count({
      where: { status: "AGENDADA" },
    });

    const distribuicaoPorCurso = await prisma.trabalho.groupBy({
      by: ["curso"],
      _count: { curso: true },
      orderBy: { _count: { curso: "desc" } },
      take: 5,
    });

    const trabalhos = await prisma.trabalho.findMany({
      select: { palavrasChave: true },
    });

    const palavrasFrequencia: Record<string, number> = {};
    trabalhos.forEach((t) => {
      t.palavrasChave.forEach((palavra: string) => {
        palavrasFrequencia[palavra] = (palavrasFrequencia[palavra] || 0) + 1;
      });
    });

    const temasFrequentes = Object.entries(palavrasFrequencia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tema, quantidade]) => ({ tema, quantidade }));

    const mediaTempoPorEtapa = [
      { etapa: "Elaboração", dias: 45 },
      { etapa: "Revisão", dias: 15 },
      { etapa: "Aprovação", dias: 7 },
      { etapa: "Banca", dias: 30 },
    ];

    return NextResponse.json({
      totalTrabalhos,
      trabalhosEmRevisao,
      trabalhosAprovados,
      bancasAgendadas,
      distribuicaoPorCurso: distribuicaoPorCurso.map((d) => ({
        curso: d.curso,
        quantidade: d._count.curso,
      })),
      temasFrequentes,
      mediaTempoPorEtapa,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
  }
});
