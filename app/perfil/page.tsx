"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Building,
  Edit,
  FileText,
  Users,
  CheckCircle,
  TrendingUp,
  PieChart,
  Activity,
  ArrowUpRight,
  Clock,
  Target,
  FilePlus,
  ShieldCheck,
  Star,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigation } from "../components/layout/Navigation";

const roleLabels: Record<string, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  COORDENADOR: "Coordenador",
  PROFESSOR_BANCA: "Avaliador",
  ADMIN: "Administrador",
};

const roleColors: Record<string, "default" | "success" | "warning" | "danger" | "info" | "purple"> = {
  ALUNO: "default",
  PROFESSOR: "info",
  COORDENADOR: "success",
  PROFESSOR_BANCA: "warning",
  ADMIN: "danger",
};

export default function PerfilPage() {
  const router = useRouter();
  const { usuario, token } = useAuth();
  const [personalStats, setPersonalStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!token || !usuario) return;

      try {
        const response = await fetch("/api/usuarios/me/estatisticas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPersonalStats(data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchStats();
  }, [token, usuario]);

  if (!usuario) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="dashboard" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-[24px] bg-[var(--surface-light)] border border-[var(--border-light)] flex items-center justify-center text-[var(--primary)] shadow-sm">
                  <User className="w-8 h-8" />
               </div>
               <div>
                 <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">Configurações de Identidade</h1>
                 <p className="text-[var(--muted)] text-sm mt-1">Dados pessoais, institucionais e métricas de desempenho acadêmico.</p>
               </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/usuarios/${usuario.id}/editar`)}
              className="rounded-2xl border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border-light)] px-8 py-6 h-auto font-black uppercase text-[10px] tracking-widest shadow-lg shadow-black/5"
            >
              <Edit className="w-4 h-4 mr-3 text-[var(--primary)]" />
              Atualizar Cadastro
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Coluna Esquerda */}
            <div className="lg:col-span-1 space-y-6">
              {/* Informações Básicas Card */}
              <Card className="surface-card overflow-hidden border-[var(--border-light)]">
                <div className="h-28 bg-gradient-to-br from-[var(--primary)] via-[#7C3AED] to-[#4F46E5] relative">
                  <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] mix-blend-overlay"></div>
                  <div className="absolute -bottom-1 -left-1 -right-1 h-8 bg-gradient-to-t from-[var(--surface)] to-transparent"></div>
                </div>
                <div className="px-8 pb-10 text-center -mt-14 relative z-10">
                  <div className="w-28 h-28 bg-[var(--surface)] rounded-[32px] border-8 border-[var(--surface)] shadow-2xl mx-auto flex items-center justify-center mb-6 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)]/10 flex items-center justify-center">
                      <span className="text-4xl font-black text-[var(--primary)]">{usuario.nome.charAt(0)}</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight mb-2">
                    {usuario.nome}
                  </h2>
                  <Badge variant={roleColors[usuario.role] as any} className="uppercase tracking-[0.2em] text-[9px] font-black py-1.5 px-4 rounded-full border-none bg-opacity-10 backdrop-blur-sm">
                    {roleLabels[usuario.role] || usuario.role}
                  </Badge>
                  
                  <div className="mt-10 space-y-5 text-left">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">E-mail Institucional</p>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border-light)]">
                        <Mail className="w-4 h-4 text-[var(--muted)]" />
                        <p className="text-xs font-bold text-[var(--foreground)] truncate">{usuario.email}</p>
                      </div>
                    </div>

                    {usuario.telefone && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Contato</p>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-light)] border border-[var(--border-light)]">
                          <Phone className="w-4 h-4 text-[var(--muted)]" />
                          <p className="text-xs font-bold text-[var(--foreground)]">{usuario.telefone}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex items-center justify-between text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest px-1">
                      <span>Membro desde</span>
                      <span className="text-[var(--foreground)]">
                        {usuario.createdAt ? format(new Date(usuario.createdAt), "MMM yyyy", { locale: ptBR }) : "---"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Status Section */}
              <Card className="surface-card p-8 border-[var(--border-light)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)]">
                <h3 className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Signos de Atividade
                </h3>
                
                {isLoadingStats ? (
                  <div className="space-y-4">
                     {[1,2,3].map(i => <div key={i} className="h-12 bg-[var(--border-light)] rounded-xl animate-pulse"></div>)}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {personalStats?.tipo === "ALUNO" && (
                      <>
                        <div className="p-5 rounded-[24px] bg-white dark:bg-white/5 border border-[var(--border-light)] shadow-sm">
                          <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Trabalhos Criados</p>
                          <div className="flex items-end justify-between">
                             <span className="text-3xl font-black text-[var(--foreground)]">{personalStats.stats.totalTrabalhos}</span>
                             <FileText className="w-6 h-6 text-[var(--primary)] opacity-40 mb-1" />
                          </div>
                        </div>
                        <div className="p-5 rounded-[24px] bg-white dark:bg-white/5 border border-[var(--border-light)] shadow-sm">
                          <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Bancas Realizadas</p>
                          <div className="flex items-end justify-between">
                             <span className="text-3xl font-black text-[var(--foreground)]">{personalStats.stats.totalBancas}</span>
                             <Award className="w-6 h-6 text-amber-500 opacity-40 mb-1" />
                          </div>
                        </div>
                      </>
                    )}

                    {personalStats?.tipo === "DOCENTE" && (
                      <>
                        <div className="p-5 rounded-[24px] bg-white dark:bg-white/5 border border-[var(--border-light)] shadow-sm">
                          <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Orientações Ativas</p>
                          <div className="flex items-end justify-between">
                             <span className="text-3xl font-black text-[var(--foreground)]">{personalStats.stats.trabalhos.total}</span>
                             <TrendingUp className="w-6 h-6 text-emerald-500 opacity-40 mb-1" />
                          </div>
                        </div>
                        <div className="p-5 rounded-[24px] bg-white dark:bg-white/5 border border-[var(--border-light)] shadow-sm">
                          <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Total de Bancas</p>
                          <div className="flex items-end justify-between">
                             <span className="text-3xl font-black text-[var(--foreground)]">{personalStats.stats.totalBancasMembro}</span>
                             <Users className="w-6 h-6 text-purple-500 opacity-40 mb-1" />
                          </div>
                        </div>
                      </>
                    )}

                    {!isLoadingStats && personalStats?.stats.atividadesSemana !== undefined && (
                      <div className="p-6 rounded-[32px] bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-125 transition-transform">
                          <Zap className="w-12 h-12" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Índice de Atividade</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black">{personalStats.stats.atividadesSemana}</span>
                          <span className="text-[10px] font-bold opacity-70">ações / 7 dias</span>
                        </div>
                        <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                            style={{ width: `${Math.min(100, (personalStats.stats.atividadesSemana / 10) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Conquistas Acadêmicas */}
              {!isLoadingStats && personalStats?.stats.conquistas?.length > 0 && (
                <Card className="surface-card p-8 border-[var(--border-light)]">
                  <h3 className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Conquistas Acadêmicas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {personalStats.stats.conquistas.map((c: any) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-[var(--surface-light)] border border-[var(--border-light)] flex flex-col items-center text-center gap-2 group hover:border-[var(--primary)] transition-all">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-[var(--primary)] shadow-sm group-hover:scale-110 transition-transform">
                          {c.icon === "FilePlus" && <FilePlus className="w-5 h-5" />}
                          {c.icon === "TrendingUp" && <TrendingUp className="w-5 h-5" />}
                          {c.icon === "Award" && <Award className="w-5 h-5" />}
                          {c.icon === "CheckCircle" && <CheckCircle className="w-5 h-5" />}
                          {c.icon === "Users" && <Users className="w-5 h-5" />}
                          {c.icon === "ShieldCheck" && <ShieldCheck className="w-5 h-5" />}
                          {c.icon === "Star" && <Star className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{c.titulo}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Coluna Direita - Detalhes e Performance */}
            <div className="lg:col-span-3 space-y-8">
              {/* Performance Dash / Student Progress */}
              {personalStats?.tipo === "ALUNO" && personalStats.stats.trabalhoAtual && (
                <Card className="surface-card p-10 bg-gradient-to-br from-[var(--primary)] to-[#4F46E5] text-white border-none overflow-hidden relative shadow-2xl">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                   <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[60px] -ml-24 -mb-24"></div>
                   
                   <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest">
                           <Target className="w-3 h-3" /> Status do Projeto Atual
                        </div>
                        <h3 className="text-3xl font-black leading-tight italic">"{personalStats.stats.trabalhoAtual.titulo}"</h3>
                        <div className="flex flex-wrap gap-4">
                           <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                              <span className="text-xs font-bold text-white/80">{personalStats.stats.trabalhoAtual.status}</span>
                           </div>
                           <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                              <User className="w-3 h-3 text-white/60" />
                              <span className="text-xs font-bold text-white/80">Orientado por {personalStats.stats.trabalhoAtual.orientador}</span>
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center p-8 rounded-[40px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-inner">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                           <svg className="w-full h-full -rotate-90">
                              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/10" />
                              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * personalStats.stats.progressoRecente) / 100} className="text-white" strokeLinecap="round" />
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-4xl font-black">{personalStats.stats.progressoRecente}%</span>
                              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Concluído</span>
                           </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest mt-6 opacity-80">Jornada de Formação</p>
                      </div>
                    </div>
                 </Card>
              )}

              {/* Novidade: Metas e Objetivos Dinâmicos */}
              {!isLoadingStats && personalStats?.stats.metas?.length > 0 && (
                <Card className="surface-card p-10 border-[var(--border-light)] overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full -mr-16 -mt-16"></div>
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">Gestão de Metas</h3>
                       <p className="text-xs text-[var(--muted)] font-medium mt-1">Sugestões inteligentes baseadas no seu status atual.</p>
                     </div>
                     <Target className="w-6 h-6 text-[var(--primary)] opacity-40" />
                   </div>
                   
                   <div className="space-y-4">
                     {personalStats.stats.metas.map((meta: any, idx: number) => (
                       <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-[var(--surface-light)] border border-[var(--border-light)] hover:border-[var(--primary)]/30 transition-all group">
                         <div className="flex items-center gap-4">
                           <div className={`w-2 h-10 rounded-full ${
                             meta.prioridade === "ALTA" ? "bg-red-500" : 
                             meta.prioridade === "MEDIA" ? "bg-amber-500" : "bg-emerald-500"
                           }`}></div>
                           <div>
                             <p className="text-sm font-black text-[var(--foreground)]">{meta.titulo}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <Badge variant="default" className={`text-[8px] font-black uppercase py-0.5 px-2 rounded-md border-none ${
                                 meta.prioridade === "ALTA" ? "bg-red-100 text-red-600" : 
                                 meta.prioridade === "MEDIA" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                               }`}>
                                 Prioridade {meta.prioridade}
                               </Badge>
                             </div>
                           </div>
                         </div>
                         <Button size="sm" variant="outline" className="rounded-xl border-[var(--border)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                            Focar Agora
                         </Button>
                       </div>
                     ))}
                   </div>
                </Card>
              )}

              {personalStats?.tipo === "DOCENTE" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="surface-card p-8 border-[var(--border-light)] flex flex-col justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6">
                         <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Taxa de Aprovação</p>
                        <h4 className="text-4xl font-black text-[var(--foreground)]">{personalStats.stats.performance.taxaAprovacao.toFixed(1)}%</h4>
                        <div className="h-2 bg-[var(--surface-light)] rounded-full mt-4 overflow-hidden">
                           <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${personalStats.stats.performance.taxaAprovacao}%` }}></div>
                        </div>
                      </div>
                   </Card>

                   <Card className="surface-card p-8 border-[var(--border-light)] flex flex-col justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] mb-6">
                         <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Ritmo de Revisão</p>
                        <h4 className="text-4xl font-black text-[var(--foreground)]">{personalStats.stats.performance.tempoMedioRevisao} dias</h4>
                        <p className="text-[10px] text-[var(--muted)] mt-2 italic font-bold">Tempo médio de resposta</p>
                      </div>
                   </Card>

                   <Card className="surface-card p-8 border-[var(--border-light)] flex flex-col justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 mb-6">
                         <PieChart className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Atividades Totais</p>
                        <h4 className="text-4xl font-black text-[var(--foreground)]">{personalStats.stats.totalAtividades}</h4>
                        <p className="text-[10px] text-[var(--muted)] mt-2 italic font-bold">Trabalhos + Bancas</p>
                      </div>
                   </Card>
                </div>
              )}

              {/* Bento Grid - Informações Administrativas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="surface-card p-10 border-[var(--border-light)]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Atributos de Classe</h3>
                    <Award className="w-5 h-5 text-[var(--primary)] opacity-40" />
                  </div>
                  
                  <div className="space-y-8">
                    {usuario.role === "ALUNO" ? (
                      <>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                             <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Matrícula</p>
                             <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-light)] font-bold text-sm">
                               {usuario.matricula || "---"}
                             </div>
                           </div>
                           <div className="space-y-1">
                             <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Departamento</p>
                             <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-light)] font-bold text-sm">
                               Coord. Acadêmica
                             </div>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Curso Vinculado</p>
                           <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-light)] font-black text-sm text-[var(--primary)]">
                             {usuario.curso || "---"}
                           </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                             <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Titulação</p>
                             <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-light)] font-bold text-sm">
                               {usuario.titulacao || "---"}
                             </div>
                           </div>
                           <div className="space-y-1">
                             <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Departamento</p>
                             <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border-light)] font-bold text-sm">
                               {usuario.departamento || "---"}
                             </div>
                           </div>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Lattes ID / Currículo</p>
                           <a 
                             href={usuario.lattes || "#"} 
                             target="_blank" 
                             className="flex items-center justify-between p-4 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 font-black text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                           >
                              ACESSAR PLATAFORMA LATTES
                              <ArrowUpRight className="w-4 h-4" />
                           </a>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <Card className="surface-card p-10 border-[var(--border-light)]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-[var(--foreground)] tracking-tight">Atalhos Operacionais</h3>
                    <div className="p-1.5 rounded-lg bg-[var(--surface-light)] border border-[var(--border-light)]">
                       <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => router.push(usuario.role === "ALUNO" ? "/trabalhos" : "/bancas")}
                      className="p-5 rounded-[24px] bg-[var(--foreground)] text-white hover:scale-[1.02] active:scale-95 transition-all text-left group overflow-hidden relative shadow-xl shadow-black/10"
                    >
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                          <BookOpen className="w-16 h-16" />
                       </div>
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Fluxo Direto</p>
                       <p className="font-black text-sm uppercase tracking-tight">Visualizar {usuario.role === "ALUNO" ? "Cronograma" : "Minhas Bancas"}</p>
                    </button>

                    <button 
                      onClick={() => router.push("/notificacoes")}
                      className="p-5 rounded-[24px] bg-[var(--surface-light)] border border-[var(--border-light)] hover:border-[var(--primary)] hover:shadow-lg transition-all text-left flex items-center justify-between group"
                    >
                       <div>
                         <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Central de Mensagens</p>
                         <p className="font-black text-sm text-[var(--foreground)] uppercase tracking-tight">Todas Notificações</p>
                       </div>
                       <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center group-hover:text-[var(--primary)] transition-colors">
                          <Activity className="w-4 h-4" />
                       </div>
                    </button>
                    
                    <button 
                      onClick={() => router.push("/feedback")}
                      className="p-5 rounded-[24px] bg-[var(--surface-light)] border border-[var(--border-light)] hover:border-[var(--primary)] hover:shadow-lg transition-all text-left flex items-center justify-between group"
                    >
                       <div>
                         <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Suporte Técnico</p>
                         <p className="font-black text-sm text-[var(--foreground)] uppercase tracking-tight">Reportar Incidente</p>
                       </div>
                       <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center group-hover:text-[var(--primary)] transition-colors">
                          <ArrowUpRight className="w-4 h-4" />
                       </div>
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
