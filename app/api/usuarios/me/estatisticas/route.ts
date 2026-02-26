import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import { prisma } from "@/app/lib/prisma";
import { gerarRelatorioOrientador } from "@/app/lib/relatorios";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { userId, role } = user;

    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataFim.getDate() - 7); // Última semana

    if (role === "ALUNO") {
      const [trabalhos, bancas, atividadesRecentes] = await Promise.all([
        prisma.trabalho.findMany({
          where: { alunoId: userId },
          include: {
            orientador: { select: { nome: true } },
            banca: true,
            versoes: { select: { dataUpload: true } }
          }
        }),
        prisma.banca.count({
          where: { trabalho: { alunoId: userId } }
        }),
        prisma.versaoDocumento.count({
          where: { 
            uploadPorId: userId,
            dataUpload: { gte: dataInicio }
          }
        })
      ]);

      const trabalhoRecente = trabalhos[0];
      let progresso = 0;
      if (trabalhoRecente) {
        const statusMap: Record<string, number> = {
          "EM_ELABORACAO": 20, "SUBMETIDO": 40, "EM_REVISAO": 50,
          "APROVADO_ORIENTADOR": 70, "AGUARDANDO_BANCA": 80,
          "BANCA_AGENDADA": 90, "APROVADO": 100, "REPROVADO": 100
        };
        progresso = statusMap[trabalhoRecente.status] || 0;
      }

      // Milestones (Conquistas)
      const conquistas = [];
      if (trabalhos.length > 0) conquistas.push({ id: "first-work", titulo: "Primeiro Registro", icon: "FilePlus" });
      if (trabalhos.some(t => t.versoes.length > 3)) conquistas.push({ id: "dedicated", titulo: "Dedicado", icon: "TrendingUp" });
      if (bancas > 0) conquistas.push({ id: "banca-ready", titulo: "Pronto para Defesa", icon: "Award" });
      if (trabalhos.some(t => t.status === "APROVADO")) conquistas.push({ id: "graduated", titulo: "Graduado", icon: "CheckCircle" });

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
          } : null,
          atividadesSemana: atividadesRecentes,
          conquistas
        }
      });
    }

    if (role === "PROFESSOR" || role === "COORDENADOR" || role === "PROFESSOR_BANCA") {
      const [relatorioOrientador, totalBancasMembro, comentariosRecentemente, bancasSemana, trabalhosPendentes] = await Promise.all([
        gerarRelatorioOrientador(userId, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), dataFim),
        prisma.membroBanca.count({ where: { usuarioId: userId } }),
        prisma.comentario.count({ 
          where: { 
            autorId: userId,
            dataComentario: { gte: dataInicio }
          }
        }),
        prisma.membroBanca.count({
          where: {
            usuarioId: userId,
            banca: { data: { gte: dataInicio } }
          }
        }),
        prisma.trabalho.count({
          where: { 
            orientadorId: userId,
            status: "SUBMETIDO"
          }
        })
      ]);

      const conquistas = [];
      if (relatorioOrientador.trabalhos.total > 0) conquistas.push({ id: "mentor", titulo: "Mestre Orientador", icon: "Users" });
      if (totalBancasMembro > 5) conquistas.push({ id: "expert", titulo: "Avaliador Experiente", icon: "ShieldCheck" });
      if (relatorioOrientador.performance.taxaAprovacao > 90) conquistas.push({ id: "high-success", titulo: "Taxa de Elite", icon: "Star" });

      // Metas Contextuais para Docentes
      const metas = [];
      if (trabalhosPendentes > 0) metas.push({ titulo: `Revisar ${trabalhosPendentes} trabalhos pendentes`, prioridade: "ALTA" });
      if (totalBancasMembro > 0) metas.push({ titulo: "Confirmar participações em bancas", prioridade: "MEDIA" });
      metas.push({ titulo: "Atualizar currículo Lattes", prioridade: "BAIXA" });

      return NextResponse.json({
        tipo: "DOCENTE",
        stats: {
          ...relatorioOrientador,
          totalBancasMembro,
          totalAtividades: relatorioOrientador.trabalhos.total + totalBancasMembro,
          atividadesSemana: comentariosRecentemente + bancasSemana,
          conquistas,
          metas
        }
      });
    }

    return NextResponse.json({ error: "Papel de usuário não suporta estatísticas detalhadas" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao carregar estatísticas pessoais:", error);
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 });
  }
});
