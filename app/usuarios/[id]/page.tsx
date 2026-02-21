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
  Mail, 
  Phone, 
  Book, 
  Building, 
  Award, 
  ArrowLeft, 
  Edit,
  GraduationCap,
  Calendar,
  Contact
} from "lucide-react";
import Link from "next/link";

export default function UsuarioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, usuario: currentUsuario } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const id = params.id as string;

  useEffect(() => {
    async function fetchUser() {
      if (!token) return;
      try {
        const response = await fetch(`/api/usuarios/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else if (response.status === 404) {
          router.push("/usuarios");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [id, token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!user) return null;

  const canEdit = currentUsuario?.role === "ADMIN" || currentUsuario?.id === id;

  const roleLabels: Record<string, string> = {
    ALUNO: "Discente",
    PROFESSOR: "Professor(a)",
    COORDENADOR: "Coordenador(a)",
    PROFESSOR_BANCA: "Avaliador(a) Externo",
    ADMIN: "Administrador(a)",
  };

  const roleVariants: Record<string, "info" | "success" | "purple" | "warning" | "danger" | "default"> = {
    ALUNO: "info",
    PROFESSOR: "success",
    COORDENADOR: "purple",
    PROFESSOR_BANCA: "warning",
    ADMIN: "danger",
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="usuarios" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-10 animate-fade-in pb-20">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-bold text-sm uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="flex gap-4">
                {canEdit && (
                  <Link href={`/usuarios/${id}/editar`}>
                    <Button variant="gradient" className="rounded-2xl px-8 shadow-lg shadow-[var(--primary)]/20">
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="surface-card overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] relative">
                    <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
                  </div>
                  <div className="p-8 -mt-16 relative z-10 text-center">
                    <div className="w-28 h-28 rounded-[40px] bg-white dark:bg-gray-800 shadow-2xl flex items-center justify-center mx-auto mb-6 border-[6px] border-white dark:border-gray-800">
                      <div className="w-full h-full rounded-[34px] bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)] flex items-center justify-center text-white text-4xl font-black italic">
                        {user.nome.charAt(0)}
                      </div>
                    </div>
                    <Badge variant={roleVariants[user.role] || "default"} className="mb-4 px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                      {roleLabels[user.role] || user.role}
                    </Badge>
                    <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-tight">
                      {user.nome}
                    </h2>
                    <p className="text-sm font-bold text-[var(--muted)] mt-2">{user.email}</p>
                    
                    <div className="mt-8 pt-8 border-t border-[var(--border-light)] flex justify-center gap-6">
                       <div className="text-center">
                          <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Desde</p>
                          <p className="font-bold text-[var(--foreground)]">2024</p>
                       </div>
                       <div className="w-px h-8 bg-[var(--border-light)]"></div>
                       <div className="text-center">
                          <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Status</p>
                          <p className="font-bold text-emerald-500">Ativo</p>
                       </div>
                    </div>
                  </div>
                </Card>

                <Card className="surface-card p-8">
                  <h4 className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2 italic">
                    <Contact className="w-4 h-4" /> Informações de Contato
                  </h4>
                  <div className="space-y-6 text-sm">
                    <div className="flex items-start gap-4">
                      <Mail className="w-4 h-4 text-[var(--muted-light)] mt-1" />
                      <div>
                        <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Email Institucional</p>
                        <p className="font-bold text-[var(--foreground)]">{user.email}</p>
                      </div>
                    </div>
                    {user.telefone && (
                      <div className="flex items-start gap-4">
                        <Phone className="w-4 h-4 text-[var(--muted-light)] mt-1" />
                        <div>
                          <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Contato Direto</p>
                          <p className="font-bold text-[var(--foreground)]">{user.telefone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Detail Info */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="surface-card p-10 font-[Plus\ Jakarta\ Sans]">
                  <h3 className="text-2xl font-black text-[var(--foreground)] mb-10 border-b border-[var(--border-light)] pb-4 italic tracking-tight">Atributos Acadêmicos</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {user.role === "ALUNO" && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest flex items-center gap-2">
                             <GraduationCap className="w-3.5 h-3.5" /> Matrícula (RA)
                          </label>
                          <p className="text-xl font-bold text-[var(--foreground)] bg-[var(--surface-light)]/40 p-4 rounded-2xl border border-[var(--border-light)]">
                            {user.matricula || "Não informada"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest flex items-center gap-2">
                             <Book className="w-3.5 h-3.5" /> Curso Vigente
                          </label>
                          <p className="text-xl font-bold text-[var(--foreground)] bg-[var(--surface-light)]/40 p-4 rounded-2xl border border-[var(--border-light)]">
                            {user.curso || "Não informado"}
                          </p>
                        </div>
                      </>
                    )}

                    {(user.role === "PROFESSOR" || user.role === "COORDENADOR" || user.role === "PROFESSOR_BANCA") && (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest flex items-center gap-2">
                             <Award className="w-3.5 h-3.5" /> Titulação Acadêmica
                          </label>
                          <p className="text-xl font-bold text-[var(--foreground)] bg-[var(--surface-light)]/40 p-4 rounded-2xl border border-[var(--border-light)]">
                            {user.titulacao || "Docente"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest flex items-center gap-2">
                             <Building className="w-3.5 h-3.5" /> Departamento / Área
                          </label>
                          <p className="text-xl font-bold text-[var(--foreground)] bg-[var(--surface-light)]/40 p-4 rounded-2xl border border-[var(--border-light)]">
                            {user.departamento || "Área Técnica"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
                
                {/* Atividade Recente ou Vínculos */}
                <Card className="surface-card p-10 bg-gradient-to-br from-[var(--background)] to-[var(--surface-light)]/30">
                   <div className="flex items-center gap-3 mb-8">
                      <Calendar className="w-6 h-6 text-[var(--muted-light)]" />
                      <h3 className="text-2xl font-black text-[var(--foreground)]">Vínculos Institucionais</h3>
                   </div>
                   <div className="py-12 text-center border-2 border-dashed border-[var(--border)] rounded-[32px] bg-white/50 dark:bg-gray-800/50">
                      <p className="text-[var(--muted)] font-medium italic">Histórico acadêmico e participações em bancas serão listados aqui em futuras atualizações.</p>
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
              Qualidade Acadêmica Certificada • © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
