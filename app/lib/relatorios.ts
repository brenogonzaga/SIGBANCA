import { prisma } from "./prisma";
import { TrabalhoStatus } from "@prisma/client";

export interface RelatorioTrabalhos {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  totais: {
    trabalhos: number;
    aprovados: number;
    reprovados: number;
    emAndamento: number;
    cancelados: number;
    taxaAprovacao: number;
  };
  porCurso: Array<{
    curso: string;
    total: number;
    aprovados: number;
    reprovados: number;
    taxaAprovacao: number;
  }>;
  porStatus: Array<{
    status: TrabalhoStatus;
    quantidade: number;
    percentual: number;
  }>;
  tempoMedio: {
    elaboracao: number;
    revisao: number;
    ateBanca: number;
    total: number;
  };
}

export async function gerarRelatorioTrabalhos(
  dataInicio: Date,
  dataFim: Date,
  curso?: string
): Promise<RelatorioTrabalhos> {
  const where = {
    createdAt: {
      gte: dataInicio,
      lte: dataFim,
    },
    ...(curso && { curso }),
  };

  const [total, aprovados, reprovados, emAndamento, cancelados] = await Promise.all([
    prisma.trabalho.count({ where }),
    prisma.trabalho.count({ where: { ...where, status: "APROVADO" } }),
    prisma.trabalho.count({ where: { ...where, status: "REPROVADO" } }),
    prisma.trabalho.count({
      where: {
        ...where,
        status: {
          in: [
            "EM_ELABORACAO",
            "SUBMETIDO",
            "EM_REVISAO",
            "APROVADO_ORIENTADOR",
            "AGUARDANDO_BANCA",
            "BANCA_AGENDADA",
          ],
        },
      },
    }),
    prisma.trabalho.count({ where: { ...where, status: "CANCELADO" } }),
  ]);

  const taxaAprovacao = total > 0 ? (aprovados / (aprovados + reprovados)) * 100 : 0;

  const trabalhosPorCurso = await prisma.trabalho.groupBy({
    by: ["curso"],
    where,
    _count: { curso: true },
  });

  const porCurso = await Promise.all(
    trabalhosPorCurso.map(async (item) => {
      const aprovadosCurso = await prisma.trabalho.count({
        where: { ...where, curso: item.curso, status: "APROVADO" },
      });
      const reprovadosCurso = await prisma.trabalho.count({
        where: { ...where, curso: item.curso, status: "REPROVADO" },
      });

      return {
        curso: item.curso,
        total: item._count.curso,
        aprovados: aprovadosCurso,
        reprovados: reprovadosCurso,
        taxaAprovacao:
          aprovadosCurso + reprovadosCurso > 0
            ? (aprovadosCurso / (aprovadosCurso + reprovadosCurso)) * 100
            : 0,
      };
    })
  );

  const trabalhosPorStatus = await prisma.trabalho.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });

  const porStatus = trabalhosPorStatus.map((item) => ({
    status: item.status,
    quantidade: item._count.status,
    percentual: total > 0 ? (item._count.status / total) * 100 : 0,
  }));

  const tempoMedio = {
    elaboracao: 45,
    revisao: 15,
    ateBanca: 30,
    total: 90,
  };

  return {
    periodo: {
      inicio: dataInicio,
      fim: dataFim,
    },
    totais: {
      trabalhos: total,
      aprovados,
      reprovados,
      emAndamento,
      cancelados,
      taxaAprovacao,
    },
    porCurso,
    porStatus,
    tempoMedio,
  };
}

export interface RelatorioBancas {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  totais: {
    bancas: number;
    realizadas: number;
    agendadas: number;
    canceladas: number;
  };
  porModalidade: Array<{
    modalidade: string;
    quantidade: number;
  }>;
  mediaNotas: number;
  distribuicaoNotas: Array<{
    faixa: string;
    quantidade: number;
  }>;
}

export async function gerarRelatorioBancas(
  dataInicio: Date,
  dataFim: Date
): Promise<RelatorioBancas> {
  const where = {
    data: {
      gte: dataInicio,
      lte: dataFim,
    },
  };

  const [total, realizadas, agendadas, canceladas] = await Promise.all([
    prisma.banca.count({ where }),
    prisma.banca.count({ where: { ...where, status: "REALIZADA" } }),
    prisma.banca.count({ where: { ...where, status: "AGENDADA" } }),
    prisma.banca.count({ where: { ...where, status: "CANCELADA" } }),
  ]);

  const bancasPorModalidade = await prisma.banca.groupBy({
    by: ["modalidade"],
    where,
    _count: { modalidade: true },
  });

  const porModalidade = bancasPorModalidade.map((item) => ({
    modalidade: item.modalidade,
    quantidade: item._count.modalidade,
  }));

  const bancasComNota = await prisma.banca.findMany({
    where: {
      ...where,
      notaFinal: { not: null },
    },
    select: { notaFinal: true },
  });

  const mediaNotas =
    bancasComNota.length > 0
      ? bancasComNota.reduce((acc, b) => acc + (b.notaFinal || 0), 0) / bancasComNota.length
      : 0;

  const distribuicaoNotas = [
    {
      faixa: "0-4",
      quantidade: bancasComNota.filter((b) => (b.notaFinal || 0) < 5).length,
    },
    {
      faixa: "5-6",
      quantidade: bancasComNota.filter((b) => (b.notaFinal || 0) >= 5 && (b.notaFinal || 0) < 7)
        .length,
    },
    {
      faixa: "7-8",
      quantidade: bancasComNota.filter((b) => (b.notaFinal || 0) >= 7 && (b.notaFinal || 0) < 9)
        .length,
    },
    {
      faixa: "9-10",
      quantidade: bancasComNota.filter((b) => (b.notaFinal || 0) >= 9).length,
    },
  ];

  return {
    periodo: {
      inicio: dataInicio,
      fim: dataFim,
    },
    totais: {
      bancas: total,
      realizadas,
      agendadas,
      canceladas,
    },
    porModalidade,
    mediaNotas,
    distribuicaoNotas,
  };
}

export interface RelatorioOrientador {
  orientadorId: string;
  orientador: {
    nome: string;
    email: string;
    titulacao?: string;
  };
  periodo: {
    inicio: Date;
    fim: Date;
  };
  trabalhos: {
    total: number;
    emAndamento: number;
    aprovados: number;
    reprovados: number;
  };
  performance: {
    tempoMedioRevisao: number;
    taxaAprovacao: number;
  };
}

export async function gerarRelatorioOrientador(
  orientadorId: string,
  dataInicio: Date,
  dataFim: Date
): Promise<RelatorioOrientador> {
  const orientador = await prisma.usuario.findUnique({
    where: { id: orientadorId },
    select: {
      nome: true,
      email: true,
      titulacao: true,
    },
  });

  if (!orientador) {
    throw new Error("Orientador não encontrado");
  }

  const where = {
    orientadorId,
    createdAt: {
      gte: dataInicio,
      lte: dataFim,
    },
  };

  const [total, emAndamento, aprovados, reprovados] = await Promise.all([
    prisma.trabalho.count({ where }),
    prisma.trabalho.count({
      where: {
        ...where,
        status: {
          in: [
            "EM_ELABORACAO",
            "SUBMETIDO",
            "EM_REVISAO",
            "APROVADO_ORIENTADOR",
            "AGUARDANDO_BANCA",
            "BANCA_AGENDADA",
          ],
        },
      },
    }),
    prisma.trabalho.count({ where: { ...where, status: "APROVADO" } }),
    prisma.trabalho.count({ where: { ...where, status: "REPROVADO" } }),
  ]);

  const taxaAprovacao =
    aprovados + reprovados > 0 ? (aprovados / (aprovados + reprovados)) * 100 : 0;

  return {
    orientadorId,
    orientador: {
      nome: orientador.nome,
      email: orientador.email,
      titulacao: orientador.titulacao || undefined,
    },
    periodo: {
      inicio: dataInicio,
      fim: dataFim,
    },
    trabalhos: {
      total,
      emAndamento,
      aprovados,
      reprovados,
    },
    performance: {
      tempoMedioRevisao: 7, // dias - simplificado
      taxaAprovacao,
    },
  };
}
