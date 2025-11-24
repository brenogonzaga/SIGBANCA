import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/lib/authMiddleware";
import {
  gerarRelatorioTrabalhos,
  gerarRelatorioBancas,
  gerarRelatorioOrientador,
} from "@/app/lib/relatorios";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    if (user.role !== "COORDENADOR" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas coordenadores e administradores podem gerar relatórios" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo") || "trabalhos";
    const dataInicioParam = searchParams.get("dataInicio");
    const dataFimParam = searchParams.get("dataFim");
    const curso = searchParams.get("curso");
    const orientadorId = searchParams.get("orientadorId");

    const dataFim = dataFimParam ? new Date(dataFimParam) : new Date();
    const dataInicio = dataInicioParam
      ? new Date(dataInicioParam)
      : new Date(dataFim.getTime() - 180 * 24 * 60 * 60 * 1000);

    let relatorio;

    switch (tipo) {
      case "trabalhos":
        relatorio = await gerarRelatorioTrabalhos(dataInicio, dataFim, curso || undefined);
        break;

      case "bancas":
        relatorio = await gerarRelatorioBancas(dataInicio, dataFim);
        break;

      case "orientador":
        if (!orientadorId) {
          return NextResponse.json(
            { error: "orientadorId é obrigatório para relatório de orientador" },
            { status: 400 }
          );
        }
        relatorio = await gerarRelatorioOrientador(orientadorId, dataInicio, dataFim);
        break;

      default:
        return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
    }

    return NextResponse.json({
      tipo,
      relatorio,
      geradoEm: new Date(),
      geradoPor: {
        id: user.userId,
        nome: user.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
  }
});
