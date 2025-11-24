"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { Card } from "../ui/Card";
import { FileText, Calendar, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardStats {
  totalTrabalhos: number;
  trabalhosEmElaboracao: number;
  trabalhosSubmetidos: number;
  trabalhosEmRevisao: number;
  trabalhosAprovados: number;
  trabalhosReprovados: number;
  trabalhosCancelados: number;
  bancasAgendadas: number;
  bancasRealizadas: number;
  bancasEmAndamento: number;
  pendencias: number;
  distribuicaoPorStatus: Array<{ status: string; quantidade: number; label: string }>;
  distribuicaoPorCurso: Array<{ curso: string; quantidade: number }>;
  estatisticasPorCurso: Array<{
    curso: string;
    total: number;
    aprovados: number;
    reprovados: number;
    taxaAprovacao: string;
  }>;
  temasFrequentes: Array<{ tema: string; quantidade: number }>;
  atividadesRecentes: Array<{
    acao: string;
    entidade: string;
    createdAt: string;
    usuario?: {
      nome: string;
    };
  }>;
}

export function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!token) return;

      try {
        const response = await fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Erro ao carregar estatísticas</p>
      </div>
    );
  }

  const statusCards = [
    {
      title: "Total de Trabalhos",
      value: stats.totalTrabalhos,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Em Revisão",
      value: stats.trabalhosEmRevisao,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
    },
    {
      title: "Aprovados",
      value: stats.trabalhosAprovados,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Bancas Agendadas",
      value: stats.bancasAgendadas,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
  ];

  const doughnutData = {
    labels: stats.distribuicaoPorStatus.map((item) => item.label),
    datasets: [
      {
        data: stats.distribuicaoPorStatus.map((item) => item.quantidade),
        backgroundColor: [
          "#3b82f6", // Em Elaboração
          "#f59e0b", // Submetido
          "#f97316", // Em Revisão
          "#8b5cf6", // Aprovado Orientador
          "#6366f1", // Aguardando Banca
          "#06b6d4", // Banca Agendada
          "#10b981", // Aprovado
          "#ef4444", // Reprovado
          "#6b7280", // Cancelado
        ],
      },
    ],
  };

  const barData = {
    labels: stats.distribuicaoPorCurso.map((item) => item.curso),
    datasets: [
      {
        label: "Trabalhos por Curso",
        data: stats.distribuicaoPorCurso.map((item) => item.quantidade),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const lineData = {
    labels: stats.temasFrequentes.map((item) => item.tema),
    datasets: [
      {
        label: "Frequência de Temas",
        data: stats.temasFrequentes.map((item) => item.quantidade),
        borderColor: "#10b981",
        tension: 0.4,
      },
    ],
  };

  // Gráfico de taxa de aprovação por curso
  const taxaAprovacaoData = stats.estatisticasPorCurso
    ? {
        labels: stats.estatisticasPorCurso.map((item) => item.curso),
        datasets: [
          {
            label: "Taxa de Aprovação (%)",
            data: stats.estatisticasPorCurso.map((item) => parseFloat(item.taxaAprovacao)),
            borderColor: "#8b5cf6",
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Distribuição por Curso
            </h3>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Status dos Trabalhos
            </h3>
            <Doughnut
              data={doughnutData}
              options={{ responsive: true, maintainAspectRatio: true }}
            />
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Temas Mais Frequentes
            </h3>
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </Card>

        {taxaAprovacaoData && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Taxa de Aprovação por Curso
              </h3>
              <Line
                data={taxaAprovacaoData}
                options={{ responsive: true, maintainAspectRatio: true }}
              />
            </div>
          </Card>
        )}
      </div>

      {/* Feed de Atividades Recentes */}
      {stats.atividadesRecentes && stats.atividadesRecentes.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Atividades Recentes
            </h3>
            <div className="space-y-3">
              {stats.atividadesRecentes.slice(0, 10).map((atividade, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {atividade.usuario?.nome || "Sistema"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {atividade.acao} - {atividade.entidade}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(atividade.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
