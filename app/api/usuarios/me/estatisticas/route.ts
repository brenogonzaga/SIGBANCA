import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { gerarRelatorioOrientador } from "@/app/lib/relatorios";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { userId, role } = user;

    if (role === "ALUNO") {
      const [trabalhos, bancas] = await Promise.all([
        prisma.trabalho.findMany({
          where: { alunoId: userId },
          include: {
            orientador: {
              select: { nome: true }
            },
            banca: true
          }
        }),
        prisma.banca.count({
          where: { trabalho: { alunoId: userId } }
        })
      ]);

      // Calcular progresso simplificado baseado no status do trabalho mais recente
      const trabalhoRecente = trabalhos[0];
      let progresso = 0;
      if (trabalhoRecente) {
        const statusMap: Record<string, number> = {
          "EM_ELABORACAO": 20,
          "SUBMETIDO": 40,
          "EM_REVISAO": 50,
          "APROVADO_ORIENTADOR": 70,
          "AGUARDANDO_BANCA": 80,
          "BANCA_AGENDADA": 90,
          "APROVADO": 100,
          "REPROVADO": 100
        };
        progresso = statusMap[trabalhoRecente.status] || 0;
      }

      return NextResponse.json({
        tipo: "ALUNO",
        stats: {
          totalTrabalhos: trabalhos.length,
          totalBancas: bancas,
          progressoRecente: progresso,
          trabalhoAtual: trabalhoRecente ? {
            id: trabalhoRecente.id,
            titulo: trabalhoRecente.titulo,
            status: trabalhoRecente.status,
            orientador: trabalhoRecente.orientador.nome
          } : null
        }
      });
    }

    if (role === "PROFESSOR" || role === "COORDENADOR" || role === "PROFESSOR_BANCA") {
      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setFullYear(dataFim.getFullYear() - 1); // Último ano

      const [relatorioOrientador, totalBancasMembro] = await Promise.all([
        gerarRelatorioOrientador(userId, dataInicio, dataFim),
        prisma.membroBanca.count({
          where: { usuarioId: userId }
        })
      ]);

      return NextResponse.json({
        tipo: "DOCENTE",
        stats: {
          ...relatorioOrientador,
          totalBancasMembro,
          totalAtividades: relatorioOrientador.trabalhos.total + totalBancasMembro
        }
      });
    }

    return NextResponse.json({ error: "Papel de usuário não suporta estatísticas detalhadas" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao carregar estatísticas pessoais:", error);
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 });
  }
});
