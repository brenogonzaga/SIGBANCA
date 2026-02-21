"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { Navigation } from "@/app/components/layout/Navigation";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Logo } from "@/app/components/ui/Logo";
import { 
  Bell, 
  Clock, 
  Check, 
  Trash2, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  MailOpen,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  createdAt: string;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const { token, usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todas" | "lidas" | "nao_lidas">("todas");

  const fetchNotificacoes = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/notificacoes?limit=50", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotificacoes(data.notificacoes);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const marcarComoLida = async (id: string) => {
    try {
      const response = await fetch("/api/notificacoes", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids: [id] })
      });
      if (response.ok) {
        fetchNotificacoes();
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const excluirNotificacao = async (id: string) => {
    try {
      const response = await fetch(`/api/notificacoes?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchNotificacoes();
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const response = await fetch("/api/notificacoes", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ marcarTodasComoLidas: true })
      });
      if (response.ok) {
        fetchNotificacoes();
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "INFO": return <Info className="w-5 h-5 text-blue-500" />;
      case "SUCESSO": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "ALERTA": return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const notificacoesFiltradas = notificacoes.filter(n => {
    if (filtro === "todas") return true;
    if (filtro === "lidas") return n.lida;
    if (filtro === "nao_lidas") return !n.lida;
    return true;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="dashboard" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-10 animate-fade-in pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                 <button 
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao Dashboard
                </button>
                <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                  Central de <span className="text-[var(--primary)] italic">Notificações</span>
                </h1>
                <p className="text-[var(--muted)] font-medium mt-2 italic">Acompanhe todos os eventos e atualizações do seu percurso acadêmico.</p>
              </div>

              <div className="flex gap-3">
                 <Button 
                  onClick={marcarTodasComoLidas}
                  variant="outline" 
                  className="rounded-2xl border-[var(--border)] bg-white dark:bg-gray-800 text-xs font-black uppercase tracking-widest px-6"
                  disabled={notificacoes.every(n => n.lida)}
                >
                  <MailOpen className="w-4 h-4 mr-2" />
                  Limpar Novas
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card className="surface-card p-2 rounded-[24px] flex items-center gap-1 border border-[var(--border)]">
               <button 
                onClick={() => setFiltro("todas")}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === "todas" ? "bg-[var(--foreground)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-light)]"}`}
               >
                 Todas
               </button>
               <button 
                onClick={() => setFiltro("nao_lidas")}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === "nao_lidas" ? "bg-red-500 text-white" : "text-[var(--muted)] hover:bg-[var(--surface-light)]"}`}
               >
                 Não Lidas
               </button>
               <button 
                onClick={() => setFiltro("lidas")}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtro === "lidas" ? "bg-emerald-500 text-white" : "text-[var(--muted)] hover:bg-[var(--surface-light)]"}`}
               >
                 Lidas
               </button>
            </Card>

            {/* List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="py-20 text-center animate-pulse">
                   <div className="w-12 h-12 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-4"></div>
                   <p className="text-[var(--muted)] font-black uppercase tracking-widest text-xs">Acessando Arquivos...</p>
                </div>
              ) : notificacoesFiltradas.length === 0 ? (
                <Card className="surface-card p-20 text-center border-dashed border-2 border-[var(--border)]">
                   <div className="w-16 h-16 rounded-2xl bg-[var(--surface-light)] flex items-center justify-center mx-auto mb-6">
                      <Bell className="w-8 h-8 text-[var(--muted-light)] opacity-30" />
                   </div>
                   <h3 className="text-xl font-black text-[var(--foreground)]">Sem registros no momento</h3>
                   <p className="text-[var(--muted)] font-medium">Você está em dia com todas as suas notificações.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                   {notificacoesFiltradas.map((notif) => (
                      <Card 
                        key={notif.id}
                        className={`surface-card p-6 border border-[var(--border)] transition-all group relative hover:border-[var(--primary-light)] ${!notif.lida ? 'bg-[var(--primary-light)]/[0.03] ring-1 ring-[var(--primary-light)]/20 shadow-lg shadow-[var(--primary)]/5' : 'opacity-80'}`}
                      >
                         {!notif.lida && (
                            <div className="absolute left-0 top-6 bottom-6 w-1 bg-[var(--primary)] rounded-r-full"></div>
                         )}
                         <div className="flex gap-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--border-light)] shadow-inner ${!notif.lida ? 'bg-white' : 'bg-[var(--surface-light)]'}`}>
                               {getTipoIcon(notif.tipo)}
                            </div>
                            <div className="flex-1 space-y-2">
                               <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className={`text-lg transition-colors ${!notif.lida ? 'font-black text-[var(--foreground)]' : 'font-bold text-[var(--muted)]'}`}>
                                      {notif.titulo}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-[var(--muted-light)] uppercase tracking-wider">
                                       <Clock className="w-3.5 h-3.5" />
                                       {format(new Date(notif.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!notif.lida && (
                                       <button 
                                        onClick={() => marcarComoLida(notif.id)}
                                        className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                        title="Marcar como lida"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => excluirNotificacao(notif.id)}
                                      className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                               </div>
                               <p className="text-sm text-[var(--muted)] leading-relaxed font-medium max-w-2xl">
                                  {notif.mensagem}
                               </p>
                            </div>
                         </div>
                      </Card>
                   ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-20 py-12 border-t border-[var(--border-light)] bg-[var(--surface)]/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Logo size="sm" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 mb-6 inline-flex" showText={false} />
            <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-2">
              SIGBANCA NOTIFICATION SYSTEM
            </p>
            <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider">
              Sistema de Alertas Autorizados • © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
