"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { 
  FilePieChart, 
  BarChart4, 
  Users, 
  Calendar, 
  Download, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RelatorioData {
  tipo: string;
  relatorio: any;
  geradoEm: string;
}

export function ReportsView() {
  const { token } = useAuth();
  const [tipoRelatorio, setTipoRelatorio] = useState("trabalhos");
  const [data, setData] = useState<RelatorioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    dataInicio: format(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    dataFim: format(new Date(), "yyyy-MM-dd"),
    curso: "",
  });

  const fetchRelatorio = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        tipo: tipoRelatorio,
        ...filtros
      });
      const response = await fetch(`/api/relatorios?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatorio();
  }, [tipoRelatorio, token]);

  const renderTrabalhosReport = (relatorio: any) => (
    <div className="space-y-8 animate-fade-in">
      {/* Totais Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="surface-card group hover:border-[var(--primary)] transition-all duration-500">
          <div className="p-6">
            <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-4">Volume Total</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black text-[var(--foreground)] tracking-tighter">{relatorio.totais.trabalhos}</h3>
              <div className="p-3 rounded-2xl bg-[var(--primary-light)]/30 text-[var(--primary)] group-hover:scale-110 transition-transform">
                <FilePieChart className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-[var(--border-light)] rounded-full overflow-hidden">
               <div className="h-full bg-[var(--primary)]" style={{ width: '100%' }}></div>
            </div>
          </div>
        </Card>

        <Card className="surface-card group hover:border-emerald-500/50 transition-all duration-500">
          <div className="p-6">
            <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-4">Aprovações</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">{relatorio.totais.aprovados}</h3>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> {relatorio.totais.taxaAprovacao.toFixed(1)}%
                </span>
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform mt-1">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="surface-card group hover:border-amber-500/50 transition-all duration-500">
          <div className="p-6">
            <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-4">Em Fluxo</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black text-amber-600 tracking-tighter">{relatorio.totais.emAndamento}</h3>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="surface-card group hover:border-red-500/50 transition-all duration-500">
          <div className="p-6">
            <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-4">Retenção/Canc.</p>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black text-red-600 tracking-tighter">{relatorio.totais.reprovados + relatorio.totais.cancelados}</h3>
              <div className="p-3 rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform">
                <BarChart4 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Curso Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="surface-card">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Métrica por Unidade Curricular</h3>
              <BarChart4 className="w-5 h-5 text-[var(--muted-light)]" />
            </div>
            <div className="space-y-6">
              {relatorio.porCurso.map((item: any, idx: number) => (
                <div key={idx} className="group/item">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs font-black text-[var(--foreground)] uppercase tracking-tight">{item.curso}</p>
                      <p className="text-[10px] font-bold text-[var(--muted-light)]">{item.total} trabalhos submetidos</p>
                    </div>
                    <span className="text-sm font-black text-[var(--primary)]">{item.taxaAprovacao.toFixed(0)}% êxito</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--surface-light)] rounded-full overflow-hidden border border-[var(--border-light)]">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] group-hover/item:opacity-80 transition-all duration-700" 
                      style={{ width: `${item.taxaAprovacao}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="surface-card">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Eficiência Cronológica</h3>
              <Clock className="w-5 h-5 text-[var(--muted-light)]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[32px] bg-[var(--surface-light)]/50 border border-[var(--border-light)] text-center">
                 <p className="text-3xl font-black text-[var(--foreground)]">{relatorio.tempoMedio.elaboracao}d</p>
                 <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mt-1">Ciclo de Elaboração</p>
              </div>
              <div className="p-6 rounded-[32px] bg-[var(--surface-light)]/50 border border-[var(--border-light)] text-center">
                 <p className="text-3xl font-black text-[var(--foreground)]">{relatorio.tempoMedio.revisao}d</p>
                 <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mt-1">Auditoria Interna</p>
              </div>
              <div className="p-6 rounded-[32px] bg-[var(--surface-light)]/50 border border-[var(--border-light)] text-center">
                 <p className="text-3xl font-black text-[var(--foreground)]">{relatorio.tempoMedio.ateBanca}d</p>
                 <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mt-1">Espera pela Banca</p>
              </div>
              <div className="p-6 rounded-[32px] bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] text-white shadow-xl shadow-indigo-500/20 text-center">
                 <p className="text-3xl font-black">{relatorio.tempoMedio.total}d</p>
                 <p className="text-[9px] font-black opacity-80 uppercase tracking-widest mt-1">Jornada Acadêmica Completa</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderBancasReport = (relatorio: any) => (
    <div className="space-y-8 animate-fade-in">
       {/* Banca Totais */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="surface-card p-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-2">Comissões Totais</p>
              <h3 className="text-4xl font-black text-[var(--foreground)]">{relatorio.totais.bancas}</h3>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
               <Users className="w-8 h-8" />
            </div>
          </Card>
          <Card className="surface-card p-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-2">Média de Notas</p>
              <h3 className="text-4xl font-black text-emerald-600">{relatorio.mediaNotas.toFixed(1)}</h3>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
               <TrendingUp className="w-8 h-8" />
            </div>
          </Card>
          <Card className="surface-card p-8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-2">Agendamentos</p>
              <h3 className="text-4xl font-black text-amber-600">{relatorio.totais.agendadas}</h3>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
               <Calendar className="w-8 h-8" />
            </div>
          </Card>
       </div>

       {/* Distribuição de Notas */}
       <Card className="surface-card">
          <div className="p-10">
            <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight mb-10 font-[Plus\ Jakarta\ Sans] text-center">Curva de Desempenho Acadêmico</h3>
            <div className="flex items-end justify-center gap-4 h-64">
               {relatorio.distribuicaoNotas.map((f: any, i: number) => {
                 const maxHeight = Math.max(...relatorio.distribuicaoNotas.map((n: any) => n.quantidade));
                 const height = maxHeight > 0 ? (f.quantidade / maxHeight) * 100 : 0;
                 return (
                   <div key={i} className="flex-1 flex flex-col items-center group/bar max-w-[120px]">
                      <div className="relative w-full overflow-hidden rounded-t-2xl flex flex-col justify-end h-full">
                         <div className="absolute top-0 w-full text-center text-xs font-black text-[var(--muted)] mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity translate-y-[-20px] group-hover/bar:translate-y-0 duration-300">
                           {f.quantidade}
                         </div>
                         <div 
                           className={`w-full bg-gradient-to-t transition-all duration-1000 ${i === 3 ? 'from-emerald-600 to-emerald-400' : 'from-[var(--primary)] to-[var(--primary-light)]'}`} 
                           style={{ height: `${height}%` }}
                         ></div>
                      </div>
                      <p className="mt-4 text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Nota {f.faixa}</p>
                   </div>
                 );
               })}
            </div>
          </div>
       </Card>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header & Type Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--surface)] p-8 rounded-[40px] border border-[var(--border)] shadow-xl shadow-black/[0.02]">
        <div className="flex gap-2 p-1.5 bg-[var(--background)] rounded-[24px] border border-[var(--border-light)]">
          <button 
            onClick={() => setTipoRelatorio("trabalhos")}
            className={`px-8 py-4 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${tipoRelatorio === "trabalhos" ? "bg-[var(--foreground)] text-white shadow-xl scale-105" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            Trabalhos Acadêmicos
          </button>
          <button 
            onClick={() => setTipoRelatorio("bancas")}
            className={`px-8 py-4 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${tipoRelatorio === "bancas" ? "bg-[var(--foreground)] text-white shadow-xl scale-105" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            Comissões & Bancas
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-[var(--background)] px-6 py-4 rounded-[20px] border border-[var(--border-light)]">
            <Filter className="w-4 h-4 text-[var(--muted-light)]" />
            <div className="flex items-center gap-4">
               <input 
                 type="date" 
                 className="bg-transparent text-[10px] font-black uppercase tracking-tighter outline-none text-[var(--foreground)]"
                 value={filtros.dataInicio}
                 onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
               />
               <span className="text-[var(--muted-light)]">→</span>
               <input 
                 type="date" 
                 className="bg-transparent text-[10px] font-black uppercase tracking-tighter outline-none text-[var(--foreground)]"
                 value={filtros.dataFim}
                 onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
               />
            </div>
          </div>
          <button 
            onClick={fetchRelatorio}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Download className="w-4 h-4" /> Relatório Oficial
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
           <div className="w-16 h-16 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin"></div>
           <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest animate-pulse">Consolidando dados acadêmicos...</p>
        </div>
      ) : data ? (
        tipoRelatorio === "trabalhos" ? renderTrabalhosReport(data.relatorio) : renderBancasReport(data.relatorio)
      ) : null}

      {/* Footer Info */}
      <div className="text-center pb-12 opacity-40">
        <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.4em]">SIGBANCA Analytics Core • {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
