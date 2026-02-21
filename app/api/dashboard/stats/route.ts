import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuth } from "@/app/lib/authMiddleware";

export const GET = withAuth(async (request, user) => {
  try {
    const totalTrabalhos = await prisma.trabalho.count();

    const trabalhosEmElaboracao = await prisma.trabalho.count({
      where: { status: "EM_ELABORACAO" },
    });

    const trabalhosSubmetidos = await prisma.trabalho.count({
      where: { status: "SUBMETIDO" },
    });

    const trabalhosEmRevisao = await prisma.trabalho.count({
      where: { status: "EM_REVISAO" },
    });

    const trabalhosAprovadosOrientador = await prisma.trabalho.count({
      where: { status: "APROVADO_ORIENTADOR" },
    });

    const trabalhosAguardandoBanca = await prisma.trabalho.count({
      where: { status: "AGUARDANDO_BANCA" },
    });

    const trabalhosBancaAgendada = await prisma.trabalho.count({
      where: { status: "BANCA_AGENDADA" },
    });

    const trabalhosAprovados = await prisma.trabalho.count({
      where: { status: "APROVADO" },
    });

    const trabalhosReprovados = await prisma.trabalho.count({
      where: { status: "REPROVADO" },
    });

    const trabalhosCancelados = await prisma.trabalho.count({
      where: { status: "CANCELADO" },
    });

    // Bancas
    const bancasAgendadas = await prisma.banca.count({
      where: { status: "AGENDADA" },
    });

    const bancasRealizadas = await prisma.banca.count({
      where: { status: "REALIZADA" },
    });

    const bancasEmAndamento = await prisma.banca.count({
      where: { status: "EM_ANDAMENTO" },
    });

    // Distribuição por status (para gráfico de pizza/rosca)
    const distribuicaoPorStatus = [
      { status: "EM_ELABORACAO", quantidade: trabalhosEmElaboracao, label: "Em Elaboração" },
      { status: "SUBMETIDO", quantidade: trabalhosSubmetidos, label: "Submetido" },
      { status: "EM_REVISAO", quantidade: trabalhosEmRevisao, label: "Em Revisão" },
      {
        status: "APROVADO_ORIENTADOR",
        quantidade: trabalhosAprovadosOrientador,
        label: "Aprovado pelo Orientador",
      },
      {
        status: "AGUARDANDO_BANCA",
        quantidade: trabalhosAguardandoBanca,
        label: "Aguardando Banca",
      },
      { status: "BANCA_AGENDADA", quantidade: trabalhosBancaAgendada, label: "Banca Agendada" },
      { status: "APROVADO", quantidade: trabalhosAprovados, label: "Aprovado" },
      { status: "REPROVADO", quantidade: trabalhosReprovados, label: "Reprovado" },
      { status: "CANCELADO", quantidade: trabalhosCancelados, label: "Cancelado" },
    ].filter((item) => item.quantidade > 0);

    // Distribuição por curso (gráfico comparativo)
    const distribuicaoPorCurso = await prisma.trabalho.groupBy({
      by: ["curso"],
      _count: { curso: true },
      orderBy: { _count: { curso: "desc" } },
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
      .slice(0, 10)
      .map(([tema, quantidade]) => ({ tema, quantidade }));

    // Feed de atividades recentes (últimas 20 ações)
    const atividadesRecentes = await prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
          },
        },
      },
    });

    let pendencias = 0;

    if (user.role === "PROFESSOR") {
      pendencias = await prisma.trabalho.count({
        where: {
          orientadorId: user.userId,
          status: "SUBMETIDO",
        },
      });
    } else if (user.role === "COORDENADOR" || user.role === "ADMIN") {
      pendencias = await prisma.trabalho.count({
        where: {
          status: {
            in: ["APROVADO_ORIENTADOR", "AGUARDANDO_BANCA"],
          },
        },
      });
    } else if (user.role === "ALUNO") {
      pendencias = await prisma.trabalho.count({
        where: {
          alunoId: user.userId,
          status: "EM_REVISAO",
        },
      });
    }

    const estatisticasPorCurso = await prisma.$queryRaw<
      { curso: string; total: bigint; aprovados: bigint; reprovados: bigint }[]
    >`
      SELECT 
        curso,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'APROVADO' THEN 1 ELSE 0 END) as aprovados,
        SUM(CASE WHEN status = 'REPROVADO' THEN 1 ELSE 0 END) as reprovados
      FROM trabalhos
      GROUP BY curso
      ORDER BY COUNT(*) DESC
    `;

    const cursoStats = estatisticasPorCurso.map((stat) => ({
      curso: stat.curso,
      total: Number(stat.total),
      aprovados: Number(stat.aprovados),
      reprovados: Number(stat.reprovados),
      taxaAprovacao:
        Number(stat.total) > 0
          ? ((Number(stat.aprovados) / Number(stat.total)) * 100).toFixed(1)
          : "0",
    }));

    return NextResponse.json({
      totalTrabalhos,
      trabalhosEmElaboracao,
      trabalhosSubmetidos,
      trabalhosEmRevisao,
      trabalhosAprovados,
      trabalhosReprovados,
      trabalhosCancelados,
      bancasAgendadas,
      bancasRealizadas,
      bancasEmAndamento,
      pendencias,

      distribuicaoPorStatus,
      distribuicaoPorCurso: distribuicaoPorCurso.map((d) => ({
        curso: d.curso,
        quantidade: d._count.curso,
      })),
      estatisticasPorCurso: cursoStats,
      temasFrequentes,

      atividadesRecentes: atividadesRecentes.map((log) => ({
        id: log.id,
        acao: log.acao,
        entidade: log.entidade,
        entidadeId: log.entidadeId,
        usuario: log.usuario,
        detalhes: log.detalhes,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
  }
});
