"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { 
  History, 
  Search, 
  Filter, 
  User as UserIcon, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  FileText,
  Users,
  Calendar,
  Settings,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LogEntry {
  id: string;
  acao: string;
  entidade: string;
  detalhes: any; // Pode ser string ou JSON objeto
  createdAt: string;
  usuario: {
    nome: string;
    email: string;
    role: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AuditLog() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    acao: "",
    entidade: "",
    dataInicio: "",
    dataFim: "",
  });

  const fetchLogs = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...filtros
      });
      const response = await fetch(`/api/auditoria?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, token]);

  const getAcaoIcon = (acao: string) => {
    const a = acao.toLowerCase();
    if (a.includes("create") || a.includes("cadastrar") || a.includes("upload")) return <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600"><Activity className="w-4 h-4" /></div>;
    if (a.includes("update") || a.includes("editar") || a.includes("revisar")) return <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><Settings className="w-4 h-4" /></div>;
    if (a.includes("delete") || a.includes("excluir") || a.includes("remover")) return <div className="p-2 rounded-lg bg-red-500/10 text-red-600"><AlertCircle className="w-4 h-4" /></div>;
    return <div className="p-2 rounded-lg bg-gray-500/10 text-gray-600"><History className="w-4 h-4" /></div>;
  };

  const getEntidadeIcon = (entidade: string) => {
    const e = entidade.toLowerCase();
    if (e.includes("trabalho")) return <FileText className="w-3.5 h-3.5" />;
    if (e.includes("usuario") || e.includes("perfil")) return <Users className="w-3.5 h-3.5" />;
    if (e.includes("banca")) return <Calendar className="w-3.5 h-3.5" />;
    return <Database className="w-3.5 h-3.5" />;
  };

  const renderDetalhes = (detalhes: any) => {
    if (!detalhes) return "Sem detalhes específicos registrados.";
    
    if (typeof detalhes === "string") return detalhes;
    
    if (typeof detalhes === "object") {
      // Se tiver campo 'evento', usar ele como principal
      if (detalhes.evento) return String(detalhes.evento);
      
      // Caso contrário, mostrar as chaves relevantes
      return Object.entries(detalhes)
        .map(([key, value]) => {
          const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
          return `${key}: ${displayValue}`;
        })
        .join(" | ");
    }
    
    return String(detalhes);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filters */}
      <Card className="surface-card">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Entidade</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
                <input 
                  type="text" 
                  placeholder="Ex: TRABALHO, USUARIO..." 
                  className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all uppercase"
                  value={filtros.entidade}
                  onChange={(e) => setFiltros({...filtros, entidade: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Ação</label>
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
                <input 
                  type="text" 
                  placeholder="Ex: EDITAR, EXCLUIR..." 
                  className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all uppercase"
                  value={filtros.acao}
                  onChange={(e) => setFiltros({...filtros, acao: e.target.value.toUpperCase()})}
                />
              </div>
            </div>
            <button 
              onClick={() => { setPage(1); fetchLogs(); }}
              className="px-8 py-3 bg-[var(--foreground)] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              Filtrar Logs
            </button>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[31px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-[var(--primary)]/20 via-[var(--border)] to-transparent hidden md:block"></div>
        
        <div className="space-y-6">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-6 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-light)] hidden md:block"></div>
                <div className="flex-1 h-32 rounded-[32px] bg-[var(--surface-light)]"></div>
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="text-center py-20 bg-[var(--surface)] rounded-[40px] border border-[var(--border)] border-dashed">
              <History className="w-12 h-12 text-[var(--muted-light)] mx-auto mb-4 opacity-20" />
              <p className="text-[var(--muted)] font-black uppercase tracking-widest">Nenhum rastro encontrado</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex flex-col md:flex-row gap-6 group">
                {/* Timeline Marker */}
                <div className="hidden md:flex flex-col items-center">
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shadow-sm group-hover:border-[var(--primary)] group-hover:shadow-lg group-hover:shadow-[var(--primary)]/10 transition-all duration-500">
                    {getAcaoIcon(log.acao)}
                  </div>
                </div>

                {/* Log Card */}
                <div className="flex-1">
                  <Card className="surface-card group-hover:border-[var(--primary-light)]/30 transition-all duration-500">
                    <div className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[var(--border-light)] border-dashed">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="default" className="text-[10px] font-black tracking-widest uppercase bg-[var(--foreground)] text-white border-none px-3 py-1">
                            {log.acao}
                          </Badge>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-light)] border border-[var(--border)] text-[var(--muted)] text-[10px] font-black uppercase tracking-tighter">
                            {getEntidadeIcon(log.entidade)}
                            {log.entidade}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(log.createdAt), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                          <p className="text-sm font-bold text-[var(--foreground)] leading-relaxed italic">
                            "{renderDetalhes(log.detalhes)}"
                          </p>
                        </div>

                        <div className="md:w-64 p-4 rounded-2xl bg-[var(--surface-light)]/50 border border-[var(--border-light)]">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 truncate">
                              <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Responsável</p>
                              <p className="text-xs font-bold text-[var(--foreground)] truncate">{log.usuario?.nome || 'Sistema'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12 bg-[var(--surface)] p-4 rounded-3xl border border-[var(--border)] shadow-sm">
          <button 
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-3 rounded-xl bg-[var(--surface-light)] hover:bg-[var(--border-light)] disabled:opacity-30 transition-all border border-[var(--border)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-6 py-2 bg-[var(--background)] rounded-xl border border-[var(--border)]">
            <span className="text-sm font-black tracking-widest">PÁGINA {page} DE {pagination.totalPages}</span>
          </div>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="p-3 rounded-xl bg-[var(--surface-light)] hover:bg-[var(--border-light)] disabled:opacity-30 transition-all border border-[var(--border)]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
