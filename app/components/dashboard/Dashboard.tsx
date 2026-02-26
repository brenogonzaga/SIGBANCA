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
import { Badge } from "../ui/Badge";
import { FileText, Calendar, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";

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
  insights: Array<{
    id: string;
    titulo: string;
    descricao: string;
    link: string;
    tipo: string;
    prioridade: "ALTA" | "MEDIA" | "BAIXA";
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
      color: "text-[var(--primary)]",
      bgColor: "bg-[var(--primary-light)]",
      borderColor: "border-[var(--primary)]",
      accentClass: "card-accent"
    },
    {
      title: "Em Revisão",
      value: stats.trabalhosEmRevisao,
      icon: Clock,
      color: "text-[var(--warning)]",
      bgColor: "bg-[var(--warning-light)]",
      borderColor: "border-[var(--warning)]",
      accentClass: "card-accent-warning"
    },
    {
      title: "Aprovados",
      value: stats.trabalhosAprovados,
      icon: CheckCircle,
      color: "text-[var(--accent)]",
      bgColor: "bg-[var(--accent-light)]",
      borderColor: "border-[var(--accent)]",
      accentClass: "card-accent-success"
    },
    {
      title: "Bancas Agendadas",
      value: stats.bancasAgendadas,
      icon: Calendar,
      color: "text-[#7C3AED]",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-500",
      accentClass: ""
    },
  ];

  const doughnutData = {
    labels: stats.distribuicaoPorStatus.map((item) => item.label),
    datasets: [
      {
        data: stats.distribuicaoPorStatus.map((item) => item.quantidade),
        backgroundColor: [
          "#6366F1", // Indigo
          "#F59E0B", // Amber
          "#F97316", // Orange
          "#8B5CF6", // Violet
          "#4F46E5", // Deep Indigo
          "#06B6D4", // Cyan
          "#10B981", // Emerald
          "#EF4444", // Red
          "#94A3B8", // Slate
        ],
        borderWidth: 0,
        hoverOffset: 15
      },
    ],
  };

  const barData = {
    labels: stats.distribuicaoPorCurso.map((item) => item.curso),
    datasets: [
      {
        label: "Trabalhos",
        data: stats.distribuicaoPorCurso.map((item) => item.quantidade),
        backgroundColor: "#4F46E5",
        borderRadius: 8,
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
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] font-[Plus\\ Jakarta\\ Sans]">Dashboard</h2>
          <p className="text-[var(--muted)] text-sm">Bem-vindo ao centro de operações do SIGBANCA.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] uppercase tracking-widest bg-[var(--surface)] px-4 py-2 rounded-full border border-[var(--border)] shadow-sm">
          <div className="status-dot status-dot-active scale-75"></div>
          Sistema Online
        </div>
      </div>

      {/* Actionable Insights Section */}
      {stats.insights && stats.insights.length > 0 && (
        <div className="animate-slide-up">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[var(--primary)] rounded-full"></div>
              <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight">Próximas Atividades</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.insights.map((insight) => (
                <Link key={insight.id} href={insight.link} className="group">
                  <Card 
                    className={`surface-card border-none overflow-hidden h-full group-hover:shadow-2xl transition-all duration-500`}
                  >
                    <div className="p-8 relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border-light)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all`}>
                          {insight.tipo === 'REVISAO' || insight.tipo === 'AJUSTE' ? <FileText className="w-5 h-5" /> : 
                           insight.tipo === 'BANCA' || insight.tipo === 'AGENDAMENTO' ? <Calendar className="w-5 h-5" /> : 
                           <CheckCircle className="w-5 h-5" />}
                        </div>
                        <Badge variant={insight.prioridade === 'ALTA' ? 'danger' : 'warning'} className="text-[8px] font-black tracking-widest uppercase py-0.5">
                          {insight.prioridade}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-black text-[var(--foreground)] tracking-tight group-hover:text-[var(--primary)] transition-colors mb-2">
                        {insight.titulo}
                      </h4>
                      <p className="text-sm text-[var(--muted)] line-clamp-2 font-medium leading-relaxed">
                        {insight.descricao}
                      </p>
                      <div className="mt-6 flex items-center text-[10px] font-black text-[var(--primary)] uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Resolver Agora
                        <CheckCircle className="w-3 h-3 ml-2" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
           </div>
        </div>
      )}

      {/* Bento Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stats Section */}
        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className={`hover-lift ${card.accentClass}`} hover>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">{card.title}</p>
                      <p className="text-3xl font-black text-[var(--foreground)] mt-2">
                        {card.value}
                      </p>
                    </div>
                    <div className={`p-4 rounded-2xl ${card.bgColor} shadow-inner`}>
                      <Icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Chart Column 1 */}
        <div className="md:col-span-2 space-y-6">
          <Card className="surface-card">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Distribuição por Curso</h3>
                <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)]">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="h-[300px] flex items-center justify-center">
                <Bar data={barData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 10 } } }, 
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } } 
                  }
                }} />
              </div>
            </div>
          </Card>

          <Card className="surface-card">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Temas Frequentes</h3>
                <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="h-[250px]">
                <Line data={lineData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { display: false }, 
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } } 
                  }
                }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Chart Column 2 */}
        <div className="md:col-span-2 space-y-6">
          <Card className="surface-card h-full">
            <div className="p-8">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-lg font-bold text-[var(--foreground)]">Status dos Trabalhos</h3>
                <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)]">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="h-[350px] flex items-center justify-center relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-[var(--foreground)]">{stats.totalTrabalhos}</span>
                  <span className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-widest">Total</span>
                </div>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "75%",
                    plugins: { 
                      legend: { 
                        position: 'bottom', 
                        labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } } 
                      } 
                    }
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Row 3: Full Width or Bento Style */}
        <div className="md:col-span-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Taxa de Aprovação */}
          <div className="lg:col-span-1">
            {taxaAprovacaoData && (
              <Card className="surface-card h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Taxa de Aprovação</h3>
                    <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)] text-[var(--muted)]">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="h-[250px]">
                    <Line
                      data={taxaAprovacaoData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { 
                          y: { beginAtZero: true, max: 100, ticks: { font: { size: 10 } } }, 
                          x: { grid: { display: false }, ticks: { font: { size: 10 } } } 
                        }
                      }}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Atividades Recentes */}
          <div className="lg:col-span-2">
            {stats.atividadesRecentes && stats.atividadesRecentes.length > 0 && (
              <Card className="surface-card h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold text-[var(--foreground)]">Atividades Recentes</h3>
                    <button className="text-[10px] font-extrabold text-[var(--primary)] hover:underline uppercase tracking-widest">Ver tudo</button>
                  </div>
                  <div className="space-y-6">
                    {stats.atividadesRecentes.slice(0, 5).map((atividade, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 group"
                      >
                        <div className="mt-1">
                          <div className="w-10 h-10 rounded-full bg-[var(--background)] flex items-center justify-center border border-[var(--border)] group-hover:border-[var(--primary)] transition-colors">
                            <span className="text-xs font-bold text-[var(--primary)] text-center">
                              {(atividade.usuario?.nome || "S").charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 border-b border-[var(--border-light)] pb-4 last:border-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-[var(--foreground)]">
                              {atividade.usuario?.nome || "Sistema"}
                            </p>
                            <span className="text-[10px] font-medium text-[var(--muted-light)]">
                              {new Date(atividade.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--muted)] leading-tight">
                            Realizou <span className="text-[var(--primary)] font-bold">{atividade.acao}</span> em {atividade.entidade}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
