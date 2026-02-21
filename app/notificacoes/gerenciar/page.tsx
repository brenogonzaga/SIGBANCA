"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { Navigation } from "@/app/components/layout/Navigation";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/components/ui/Toast";
import { Logo } from "@/app/components/ui/Logo";
import { 
  Send, 
  Users, 
  User, 
  Shield, 
  Plus, 
  X, 
  Info, 
  AlertCircle, 
  CheckCircle2,
  ArrowLeft,
  Search,
  BellRing,
  Globe
} from "lucide-react";

export default function GerenciarNotificacoesPage() {
  const router = useRouter();
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  
  const [targetType, setTargetType] = useState<"ALL" | "ROLE" | "USERS">("ROLE");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState("INFO");
  const [link, setLink] = useState("");
  
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Somente ADMIN e COORDENADOR podem acessar
  if (usuario && usuario.role !== "ADMIN" && usuario.role !== "COORDENADOR") {
    router.push("/dashboard");
    return null;
  }

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const response = await fetch(`/api/usuarios?search=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.usuarios || []);
      }
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddUser = (user: any) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message) {
      showToast("Título e mensagem são obrigatórios", "warning");
      return;
    }

    if (targetType === "ROLE" && selectedRoles.length === 0) {
      showToast("Selecione ao menos um perfil de destino", "warning");
      return;
    }

    if (targetType === "USERS" && selectedUsers.length === 0) {
      showToast("Selecione ao menos um usuário de destino", "warning");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/notificacoes/broadcast", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: title,
          mensagem: message,
          tipo: notifType,
          link: link || undefined,
          target: targetType,
          roles: targetType === "ROLE" ? selectedRoles : undefined,
          users: targetType === "USERS" ? selectedUsers.map(u => u.id) : undefined
        })
      });

      if (response.ok) {
        showToast("Broadcast enviado com sucesso!", "success");
        router.push("/notificacoes");
      } else {
        const err = await response.json();
        showToast(err.error || "Erro ao enviar notificações", "error");
      }
    } catch (error) {
      showToast("Erro de conexão com o servidor", "error");
    } finally {
      setIsSending(false);
    }
  };

  const roles = [
    { id: "ALUNO", label: "Alunos" },
    { id: "PROFESSOR", label: "Professores" },
    { id: "PROFESSOR_BANCA", label: "Avaliadores Externos" },
    { id: "COORDENADOR", label: "Coordenadores" },
    { id: "ADMIN", label: "Administradores" }
  ];

  const types = [
    { id: "INFO", icon: Info, color: "text-blue-500", bg: "bg-blue-50", label: "Informativo" },
    { id: "SUCESSO", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Sucesso" },
    { id: "ALERTA", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50", label: "Alerta" }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="dashboard" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                 <button 
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-bold text-[10px] uppercase tracking-[0.2em] mb-4"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
                <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                  Broadcast <span className="text-[var(--primary)] italic">Acadêmico</span>
                </h1>
                <p className="text-[var(--muted)] font-medium mt-2 italic">Envie comunicações autoritárias para grupos específicos de usuários.</p>
              </div>
              <div className="w-16 h-16 rounded-[24px] bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 shadow-xl shadow-[var(--primary)]/5">
                <BellRing className="w-8 h-8" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Configurações de Destino */}
              <div className="lg:col-span-1 space-y-6">
                 <Card className="surface-card p-8 space-y-8">
                    <div>
                      <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-wider mb-6 italic">Público-Alvo</h3>
                      <div className="space-y-2">
                        {[
                          { id: "ROLE", label: "Por Perfil Acadêmico", icon: Shield },
                          { id: "USERS", label: "Usuários Selecionados", icon: User },
                          { id: "ALL", label: "Toda a Instituição", icon: Globe },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTargetType(t.id as any)}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group ${targetType === t.id ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg" : "bg-[var(--surface-light)]/40 border-[var(--border-light)] text-[var(--muted)] hover:border-[var(--muted)]"}`}
                          >
                            <t.icon className={`w-5 h-5 ${targetType === t.id ? "text-white" : "group-hover:text-[var(--foreground)]"}`} />
                            <span className="text-xs font-bold">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {targetType === "ROLE" && (
                      <div className="animate-slide-up">
                        <h4 className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-4">Selecionar Perfis</h4>
                        <div className="space-y-2">
                          {roles.map((role) => (
                            <label key={role.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-light)] cursor-pointer hover:bg-[var(--surface-light)] transition-all">
                              <input 
                                type="checkbox" 
                                checked={selectedRoles.includes(role.id)}
                                onChange={() => handleRoleToggle(role.id)}
                                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                              />
                              <span className="text-xs font-bold text-[var(--foreground)]">{role.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {targetType === "USERS" && (
                      <div className="animate-slide-up space-y-4">
                        <h4 className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Adicionar Usuários</h4>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
                          <input 
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchQuery}
                            onChange={(e) => handleSearchUsers(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface-light)]/40 border border-[var(--border-light)] text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none"
                          />
                          {isLoadingUsers && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                               <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                          
                          {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-[var(--border)] rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto">
                               {searchResults.map((u) => (
                                 <button
                                   key={u.id}
                                   type="button"
                                   onClick={() => handleAddUser(u)}
                                   className="w-full px-4 py-3 text-left hover:bg-[var(--surface-light)] border-b border-[var(--border-light)] last:border-0"
                                 >
                                   <div className="font-bold text-sm">{u.nome}</div>
                                   <div className="text-[10px] text-[var(--muted-light)]">{u.email} • {u.role}</div>
                                 </button>
                               ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {selectedUsers.map((u) => (
                            <Badge key={u.id} variant="info" className="pl-3 pr-2 py-1.5 flex items-center gap-2 rounded-xl">
                              <span className="text-[9px] font-black">{u.nome.split(' ')[0]}</span>
                              <button onClick={() => handleRemoveUser(u.id)}>
                                <X className="w-3 h-3 hover:text-red-500" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                 </Card>
              </div>

              {/* Conteúdo da Mensagem */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="surface-card p-10 space-y-8">
                  <div className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest italic ml-1">Assunto da Notificação</label>
                       <input 
                        type="text" 
                        placeholder="Ex: Novo Edital Publicado"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full text-2xl font-black bg-transparent border-b-2 border-[var(--border-light)] focus:border-[var(--primary)] transition-all outline-none pb-4 placeholder:text-[var(--border)]"
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest italic ml-1">Tom de Voz (Urgência)</label>
                       <div className="flex gap-4">
                          {types.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setNotifType(t.id)}
                              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${notifType === t.id ? t.bg + " " + t.color + " border-current" : "border-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--surface-light)]"}`}
                            >
                               <t.icon className="w-5 h-5" />
                               <span className="text-xs font-black uppercase tracking-wider">{t.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest italic ml-1">Corpo da Mensagem</label>
                       <textarea 
                        rows={6}
                        placeholder="Descreva aqui o conteúdo da sua comunicação acadêmica..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-6 rounded-[32px] bg-[var(--surface-light)]/40 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white dark:focus:bg-gray-800 transition-all outline-none text-lg font-medium italic min-h-[200px]"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest italic ml-1 flex items-center gap-2">
                        Link de Destino <span className="text-[var(--muted-light)] normal-case font-medium">(Opcional)</span>
                       </label>
                       <input 
                        type="text" 
                        placeholder="/trabalhos, /bancas, https://google.com..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="w-full px-6 py-4 rounded-2xl bg-[var(--surface-light)]/40 border border-[var(--border-light)] text-sm font-bold placeholder:font-normal focus:ring-2 focus:ring-[var(--primary)] outline-none"
                       />
                    </div>
                  </div>

                  <div className="pt-10 border-t border-[var(--border-light)] flex justify-end">
                     <Button 
                      type="submit"
                      variant="gradient" 
                      disabled={isSending}
                      className="rounded-[24px] px-12 py-7 text-lg shadow-2xl shadow-[var(--primary)]/30 group"
                     >
                        {isSending ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send className="w-6 h-6 mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            Disparar Broadcast
                          </>
                        )}
                     </Button>
                  </div>
                </Card>
              </div>
            </form>
          </div>
        </main>

        <footer className="mt-20 py-12 border-t border-[var(--border-light)] bg-[var(--surface)]/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Logo size="sm" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 mb-6 inline-flex" showText={false} />
            <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-2">
              SIGBANCA BROADCAST HUB
            </p>
            <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider">
              Comunicação Centralizada e Segura • © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
