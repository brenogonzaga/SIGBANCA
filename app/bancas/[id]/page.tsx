"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { Navigation } from "@/app/components/layout/Navigation";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Logo } from "@/app/components/ui/Logo";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Edit, 
  Star, 
  ArrowLeft,
  BookOpen,
  Link as LinkIcon,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default function BancaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, usuario } = useAuth();
  const [banca, setBanca] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const id = params.id as string;

  useEffect(() => {
    async function fetchBanca() {
      if (!token) return;
      try {
        const response = await fetch(`/api/bancas/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBanca(data);
        } else if (response.status === 404) {
          router.push("/bancas");
        }
      } catch (error) {
        console.error("Erro ao carregar banca:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBanca();
  }, [id, token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!banca) return null;

  const isMembro = banca.membros.some((m: any) => m.usuarioId === usuario?.id);
  const canEdit = usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR" || isMembro;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="bancas" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-10 animate-fade-in">
            {/* Header & Back Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-bold text-sm uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="flex gap-4">
                {isMembro && banca.status !== "REALIZADA" && (
                  <Link href={`/bancas/${id}/avaliar`}>
                    <Button variant="gradient" className="rounded-2xl px-8 shadow-lg shadow-[var(--primary)]/20">
                      <Star className="w-4 h-4 mr-2" />
                      Avaliar Trabalho
                    </Button>
                  </Link>
                )}
                {canEdit && (
                  <Link href={`/bancas/${id}/editar`}>
                    <Button variant="outline" className="rounded-2xl px-6 border-[var(--border)] bg-white dark:bg-gray-800">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Agendamento
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Main Info */}
               <div className="lg:col-span-2 space-y-8">
                  <Card className="surface-card p-10 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[var(--primary)]"></div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Badge variant="info" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                          {banca.status}
                        </Badge>
                        <span className="text-xs font-bold text-[var(--muted-light)]">Protocolo: #{banca.id.slice(-8).toUpperCase()}</span>
                      </div>
                      
                      <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans] leading-tight italic">
                        "{banca.trabalho.titulo}"
                      </h1>

                      <div className="pt-8 border-t border-[var(--border-light)] grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                              <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Data da Defesa</p>
                              <p className="text-lg font-black text-[var(--foreground)]">
                                {format(new Date(banca.data), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                              <Clock className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Início Previsto</p>
                              <p className="text-lg font-black text-[var(--foreground)]">{banca.horario}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Localização / Meio</p>
                              <p className="text-lg font-black text-[var(--foreground)]">{banca.local} ({banca.modalidade})</p>
                            </div>
                          </div>
                          {banca.linkReuniao && (
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <LinkIcon className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Link de Acesso</p>
                                <a href={banca.linkReuniao} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[var(--primary)] hover:underline truncate block max-w-[200px]">
                                  {banca.linkReuniao}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Descrição do Trabalho */}
                  <Card className="surface-card p-10">
                    <div className="flex items-center gap-3 mb-6">
                      <BookOpen className="w-6 h-6 text-[var(--muted-light)]" />
                      <h3 className="text-2xl font-black text-[var(--foreground)]">Ficha Técnica do Projeto</h3>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                       <p className="text-[var(--muted)] leading-relaxed text-lg font-medium italic">
                         {banca.trabalho.descricao}
                       </p>
                    </div>
                  </Card>
               </div>

               {/* Members List */}
               <div className="space-y-8">
                  <Card className="surface-card p-8">
                    <div className="flex items-center gap-3 mb-8">
                      <Users className="w-5 h-5 text-[var(--primary)]" />
                      <h3 className="text-xl font-black text-[var(--foreground)] uppercase tracking-tight">Comissão Examinadora</h3>
                    </div>
                    <div className="space-y-6">
                      {banca.membros.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface-light)]/40 border border-[var(--border-light)] group hover:bg-white dark:hover:bg-gray-800 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-black">
                            {m.usuario.nome.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-black text-[var(--foreground)]">{m.usuario.nome}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">{m.papel}</span>
                              {m.usuario.titulacao && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--border-light)]"></span>
                                  <span className="text-[9px] font-black text-[var(--primary)] uppercase">{m.usuario.titulacao}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="surface-card p-8 bg-gradient-to-br from-[var(--background)] to-[var(--surface-light)] border-dashed">
                    <div className="flex items-center gap-3 mb-6 font-[Plus\ Jakarta\ Sans]">
                       <User className="w-5 h-5 text-[var(--muted-light)]" />
                       <h3 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tighter italic">Discente</h3>
                    </div>
                    <div className="space-y-2">
                       <p className="text-lg font-black text-[var(--foreground)]">{banca.trabalho.aluno.nome}</p>
                       <p className="text-sm font-bold text-[var(--muted)]">{banca.trabalho.aluno.curso}</p>
                       <div className="pt-4 flex gap-2">
                          <Badge variant="info" size="sm" className="font-black text-[8px] tracking-widest">RA: {banca.trabalho.aluno.matricula}</Badge>
                       </div>
                    </div>
                  </Card>
               </div>
            </div>
          </div>
        </main>

        <footer className="mt-20 py-12 border-t border-[var(--border-light)] bg-[var(--surface)]/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Logo size="sm" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 mb-6 inline-flex" showText={false} />
            <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-2">
              SIGBANCA ACADEMIC PERFORMANCE
            </p>
            <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider">
              Sistema de Gestão de Bancas • © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
