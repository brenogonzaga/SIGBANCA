"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Bell, Check, Trash2, Clock, Info, CheckCircle2, AlertCircle, Trash } from "lucide-react";
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

import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { token, usuario } = useAuth();
  const router = useRouter();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotificacoes = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/notificacoes?limit=5", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotificacoes(data.notificacoes);
        setNaoLidas(data.naoLidas);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
    const interval = setInterval(fetchNotificacoes, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const excluirNotificacao = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "INFO": return <Info className="w-4 h-4 text-blue-500" />;
      case "SUCESSO": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "ALERTA": return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!usuario) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-300 ${isOpen ? 'bg-[var(--primary)] text-white shadow-lg' : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)]'}`}
      >
        <Bell className={`w-5 h-5 ${naoLidas > 0 ? 'animate-pulse' : ''}`} />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-[var(--background)] flex items-center justify-center shadow-lg">
            {naoLidas > 9 ? '+9' : naoLidas}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-80 md:w-96 bg-[var(--surface)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden z-50 animate-scale-in origin-top-right backdrop-blur-xl">
          <div className="p-6 border-b border-[var(--border-light)] bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary-light)]/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Post-it Acadêmico</h3>
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                  Notificações do Sistema
                </p>
              </div>
              {naoLidas > 0 && (
                <button 
                  onClick={marcarTodasComoLidas}
                  className="p-2 rounded-lg bg-[var(--primary-light)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all"
                  title="Marcar todas como lidas"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notificacoes.length === 0 ? (
              <div className="py-12 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-[var(--background)] flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
                  <Bell className="w-8 h-8 text-[var(--muted-light)] opacity-20" />
                </div>
                <p className="text-sm font-bold text-[var(--muted)] italic">
                  Tudo tranquilo por aqui. Nenhuma novidade no horizonte.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-light)]">
                {notificacoes.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => !notif.lida && marcarComoLida(notif.id)}
                    className={`p-5 hover:bg-[var(--surface-light)] transition-all cursor-pointer group relative ${!notif.lida ? 'bg-[var(--primary-light)]/5' : ''}`}
                  >
                    {!notif.lida && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)]"></div>
                    )}
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border-light)] shadow-sm ${!notif.lida ? 'bg-white' : 'bg-[var(--background)]'}`}>
                        {getTipoIcon(notif.tipo)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-sm tracking-tight ${!notif.lida ? 'font-black text-[var(--foreground)]' : 'font-bold text-[var(--muted)]'}`}>
                            {notif.titulo}
                          </h4>
                          <button 
                            onClick={(e) => excluirNotificacao(notif.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-[var(--muted)] leading-relaxed font-medium">
                          {notif.mensagem}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-[var(--muted-light)] uppercase pt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(notif.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-[var(--surface-light)]/50 border-t border-[var(--border-light)] text-center">
             <button 
              onClick={() => {
                setIsOpen(false);
                router.push("/notificacoes");
              }}
              className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.2em] hover:underline"
            >
               Explorar Todo o Histórico
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
