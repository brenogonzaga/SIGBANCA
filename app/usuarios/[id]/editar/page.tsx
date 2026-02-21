"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { PublicHeader } from "@/app/components/ui/PublicHeader";
import { UserRole } from "@prisma/client";
import { ArrowLeft, User, BookOpen, Save } from "lucide-react";

const availableRoles = ["ALUNO", "PROFESSOR", "PROFESSOR_BANCA", "COORDENADOR", "ADMIN"];
const roleLabels: Record<string, string> = {
  ALUNO: "Acadêmico",
  PROFESSOR: "Professor",
  PROFESSOR_BANCA: "Avaliador Externo",
  COORDENADOR: "Coordenador",
  ADMIN: "Administrador",
};

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  role: UserRole;
  ativo: boolean;
  matricula?: string;
  curso?: string;
  dataIngresso?: string;
  titulacao?: string;
  departamento?: string;
  areaAtuacao?: string;
  lattes?: string;
}

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { token, usuario: currentUser } = useAuth();
  const { showToast } = useToast();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    role: "ALUNO" as UserRole,
    ativo: true,
    senha: "",
    matricula: "",
    curso: "",
    dataIngresso: "",
    titulacao: "",
    departamento: "",
    areaAtuacao: "",
    lattes: "",
  });

  useEffect(() => {
    params.then((p) => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (!token || !currentUser) {
      router.push("/login");
      return;
    }

    const isSelfEdit = currentUser.id === userId;
    const isAdminOrCoord = currentUser.role === "ADMIN" || currentUser.role === "COORDENADOR";

    if (!isSelfEdit && !isAdminOrCoord) {
      showToast("Você não tem permissão para editar este perfil", "error");
      router.push("/dashboard");
      return;
    }

    async function fetchUsuario() {
      try {
        const response = await fetch(`/api/usuarios/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsuario(data);
          setFormData({
            nome: data.nome || "",
            email: data.email || "",
            cpf: data.cpf || "",
            telefone: data.telefone || "",
            role: data.role || "ALUNO",
            ativo: data.ativo ?? true,
            senha: "",
            matricula: data.matricula || "",
            curso: data.curso || "",
            dataIngresso: data.dataIngresso
              ? new Date(data.dataIngresso).toISOString().split("T")[0]
              : "",
            titulacao: data.titulacao || "",
            departamento: data.departamento || "",
            areaAtuacao: data.areaAtuacao || "",
            lattes: data.lattes || "",
          });
        } else {
          router.push("/usuarios");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId, currentUser, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        ativo: formData.ativo,
      };

      if (formData.senha) {
        updateData.senha = formData.senha;
      }

      if (formData.role === "ALUNO") {
        updateData.matricula = formData.matricula;
        updateData.curso = formData.curso;
        if (formData.dataIngresso) {
          updateData.dataIngresso = formData.dataIngresso;
        }
      } else if (
        formData.role === "PROFESSOR" ||
        formData.role === "PROFESSOR_BANCA" ||
        formData.role === "COORDENADOR"
      ) {
        updateData.titulacao = formData.titulacao;
        updateData.departamento = formData.departamento;
        updateData.areaAtuacao = formData.areaAtuacao;
        updateData.lattes = formData.lattes;
      }

      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showToast("Usuário atualizado com sucesso!", "success");
        setTimeout(() => router.push("/usuarios"), 1000);
      } else {
        const error = await response.json();
        showToast(`Erro ao atualizar usuário: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      showToast("Erro ao atualizar usuário", "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <PublicHeader showBackButton backUrl="/usuarios" title="Editar Usuário" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  if (!usuario) {
    return null;
  }

  const isAluno = formData.role === "ALUNO";
  const isProfessor = formData.role === "PROFESSOR" || formData.role === "PROFESSOR_BANCA" || formData.role === "COORDENADOR";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-[var(--surface)] border-b border-[var(--border)] pt-12 pb-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-[var(--primary)]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[50%] bg-[#7C3AED]/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors mb-8 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary-light)] group-hover:bg-[var(--primary-light)]/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Painel de Controle</span>
          </button>

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-[var(--foreground)] tracking-tight mb-4">
              Ajustar <span className="bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] bg-clip-text text-transparent italic">Perfil Acadêmico</span>
            </h1>
            <p className="text-[var(--muted)] text-lg font-medium max-w-2xl mx-auto">
              Atualize as informações de <span className="text-[var(--foreground)] font-bold">{formData.nome || "Usuário"}</span> no sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-6 -mt-12 pb-20 relative z-20">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          {/* Dados Básicos - Bento Card */}
          <div className="bg-[var(--surface)] p-8 md:p-12 rounded-[48px] border border-[var(--border)] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-[var(--primary)]/10 transition-colors duration-700"></div>
            
            <div className="flex items-center gap-5 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shadow-inner">
                 <User className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">Configurações Base</h2>
                <p className="text-[var(--muted)] font-medium">Núcleo de identificação do usuário.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Identificação Nominal *</label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Dr. Leonardo da Vinci"
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">E-mail de Acesso *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  disabled // Email is not editable
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@instituicao.edu.br"
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Registro de CPF *</label>
                <input
                  type="text"
                  required
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Linha Telefônica</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Status da Conta</label>
                <div className="flex items-center gap-6 p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)]">
                   <label className="flex items-center gap-3 cursor-pointer group/toggle">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={formData.ativo}
                          onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-[var(--surface-light)] rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6"></div>
                      </div>
                      <span className={`text-sm font-black uppercase tracking-widest ${formData.ativo ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formData.ativo ? "Totalmente Operativo" : "Acesso Restrito"}
                      </span>
                   </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Atribuição de Papel *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)] appearance-none"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 md:col-span-2 border-t border-[var(--border-light)] pt-6 border-dashed">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Redefinir Acesso (Opcional)</label>
                <input
                  type="password"
                  minLength={6}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>
            </div>
          </div>

          {/* Dados Acadêmicos/Profissionais - Conditional Bento Card */}
          {(isAluno || isProfessor) && (
            <div className="bg-[var(--surface)] p-8 md:p-12 rounded-[48px] border border-[var(--border)] shadow-xl relative overflow-hidden group">
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700"></div>

               <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                   <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">Trajetória Específica</h2>
                  <p className="text-[var(--muted)] font-medium">Histórico e atuação acadêmica.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {isAluno ? (
                  <>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Matrícula Institucional *</label>
                      <input
                        type="text"
                        required
                        value={formData.matricula}
                        onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                        className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-[var(--foreground)]"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Linha de Pesquisa / Curso *</label>
                      <input
                        type="text"
                        required
                        value={formData.curso}
                        onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                        className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-[var(--foreground)]"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Inauguração do Vínculo</label>
                      <input
                        type="date"
                        value={formData.dataIngresso}
                        onChange={(e) => setFormData({ ...formData, dataIngresso: e.target.value })}
                        className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-[var(--foreground)]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Titulação Acadêmica</label>
                      <input
                        type="text"
                        value={formData.titulacao}
                        onChange={(e) => setFormData({ ...formData, titulacao: e.target.value })}
                        placeholder="Dr., MSc., Esp."
                        className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-[var(--foreground)]"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Departamento Operacional</label>
                      <input
                        type="text"
                        value={formData.departamento}
                        onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                        className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-[var(--foreground)]"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Fronteira de Atuação / Expertise</label>
                      <input
                        type="text"
                        value={formData.areaAtuacao}
                        onChange={(e) => setFormData({ ...formData, areaAtuacao: e.target.value })}
                        className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-[var(--foreground)]"
                      />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Repositório Lattes (URL)</label>
                      <input
                        type="url"
                        value={formData.lattes}
                        onChange={(e) => setFormData({ ...formData, lattes: e.target.value })}
                        placeholder="http://lattes.cnpq.br/..."
                        className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-[var(--foreground)]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-[var(--border-light)]">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-10 py-5 text-xs font-black text-[var(--muted)] hover:text-[var(--foreground)] transition-all uppercase tracking-widest bg-[var(--background)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-light)]"
            >
              Descartar Alterações
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="relative group overflow-hidden px-16 py-6 bg-[var(--foreground)] text-white rounded-[24px] font-black text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl shadow-black/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-3">
                {isSaving ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-6 h-6" />
                )}
                <span>{isSaving ? "Sincronizando..." : "Salvar Alterações"}</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
