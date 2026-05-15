"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Download, 
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ProtocoloProcessModal } from "./ProtocoloProcessModal";

interface ProtocoloListProps {
  onRefresh?: () => void;
}

export function ProtocoloList({ onRefresh }: ProtocoloListProps) {
  const { token, usuario } = useAuth();
  const [protocolos, setProtocolos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("TODOS");
  const [selectedProtocolo, setSelectedProtocolo] = useState<any | null>(null);

  const fetchProtocolos = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const url = filter === "TODOS" ? "/api/protocolos" : `/api/protocolos?status=${filter}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProtocolos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar protocolos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocolos();
  }, [token, filter]);

  const handleRefresh = () => {
    fetchProtocolos();
    if (onRefresh) onRefresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ABERTO": return <Badge variant="info">ABERTO</Badge>;
      case "EM_PROCESSAMENTO": return <Badge variant="warning">EM PROCESSAMENTO</Badge>;
      case "DEFERIDO": return <Badge variant="success">DEFERIDO</Badge>;
      case "INDEFERIDO": return <Badge variant="danger">INDEFERIDO</Badge>;
      case "CANCELADO": return <Badge variant="default">CANCELADO</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "FICHA_CATALOGRAFICA": return "Ficha Catalográfica";
      case "NADA_CONSTA": return "Nada Consta (Biblioteca)";
      case "ENTREGA_VERSAO_FINAL": return "Entrega de Versão Final";
      default: return tipo;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--muted-light)]" />
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Filtrar Status:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["TODOS", "ABERTO", "EM_PROCESSAMENTO", "DEFERIDO", "INDEFERIDO"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                filter === s 
                  ? "bg-[var(--primary)] text-white shadow-md" 
                  : "bg-white dark:bg-gray-800 text-[var(--muted)] hover:bg-[var(--border-light)] border border-[var(--border)]"
              }`}
            >
              {s === "TODOS" ? "Todos" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {protocolos.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 bg-[var(--surface-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-[var(--muted-light)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)]">Nenhum protocolo encontrado</h3>
          <p className="text-sm text-[var(--muted)]">Você ainda não possui solicitações registradas.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {protocolos.map((p) => (
            <Card key={p.id} className="p-6 hover:shadow-md transition-all border-[var(--border-light)] group relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--primary)]/20 group-hover:bg-[var(--primary)] transition-all"></div>
               
               <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusBadge(p.status)}
                      <span className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-widest">
                        Protocolo #{p.id.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-black text-[var(--foreground)] leading-tight tracking-tight">
                        {getTipoLabel(p.tipo)}
                      </h4>
                      <p className="text-sm font-medium text-[var(--muted)]">
                        {p.trabalho.titulo}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted-light)] uppercase">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(p.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                       </div>
                       {p.aluno && usuario?.role !== "ALUNO" && (
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--primary)] uppercase">
                            <Search className="w-3.5 h-3.5" />
                            {p.aluno.nome} ({p.aluno.curso})
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {p.arquivoEnviadoUrl && (
                      <a href={p.arquivoEnviadoUrl} target="_blank" rel="noopener noreferrer" title="Ver arquivo enviado">
                        <Button variant="outline" size="sm" className="rounded-xl px-4 h-10 border-[var(--border)]">
                          <Download className="w-4 h-4 mr-2" />
                          <span className="text-[10px] font-black uppercase">Anexo Aluno</span>
                        </Button>
                      </a>
                    )}
                    
                    {p.arquivoRetornoUrl && (
                      <a href={p.arquivoRetornoUrl} target="_blank" rel="noopener noreferrer" title="Baixar Resultado">
                        <Button variant="gradient" size="sm" className="rounded-xl px-6 h-10 shadow-lg shadow-[var(--primary)]/20">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Baixar Resultado</span>
                        </Button>
                      </a>
                    )}

                    {/* Botão de Processar para Staff */}
                    {(usuario?.role === "BIBLIOTECARIO" || usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN") && p.status !== "DEFERIDO" && p.status !== "INDEFERIDO" && (
                      <Button 
                        variant="info" 
                        size="sm" 
                        className="rounded-xl px-4 h-10"
                        onClick={() => setSelectedProtocolo(p)}
                      >
                        Processar
                      </Button>
                    )}
                  </div>
               </div>

               {p.observacoes && (
                 <div className="mt-4 p-4 rounded-xl bg-[var(--surface-light)]/50 border border-[var(--border-light)]">
                    <p className="text-[10px] font-black text-[var(--muted-light)] uppercase mb-1">Observações:</p>
                    <p className="text-sm text-[var(--muted)] italic">"{p.observacoes}"</p>
                 </div>
               )}
            </Card>
          ))}
        </div>
      )}

      {selectedProtocolo && (
        <ProtocoloProcessModal 
          protocolo={selectedProtocolo}
          onClose={() => setSelectedProtocolo(null)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
