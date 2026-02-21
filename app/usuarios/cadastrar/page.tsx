"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { UserPlus, ArrowLeft, Save } from "lucide-react";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  COORDENADOR: "Coordenador",
  PROFESSOR: "Professor",
  PROFESSOR_BANCA: "Professor de Banca",
  ALUNO: "Aluno",
};

export default function CadastrarUsuarioPage() {
  const router = useRouter();
  const { token, usuario: currentUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome: "",
    cpf: "",
    telefone: "",
    role: "ALUNO",
    matricula: "",
    curso: "",
    dataIngresso: "",
    titulacao: "",
    departamento: "",
    areaAtuacao: "",
    lattes: "",
  });

  const getAvailableRoles = () => {
    if (currentUser?.role === "ADMIN") {
      return ["ADMIN", "COORDENADOR", "PROFESSOR", "PROFESSOR_BANCA", "ALUNO"];
    } else if (currentUser?.role === "COORDENADOR") {
      return ["PROFESSOR", "PROFESSOR_BANCA", "ALUNO"];
    } else if (currentUser?.role === "PROFESSOR") {
      return ["ALUNO"];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        email: formData.email,
        senha: formData.senha,
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone || undefined,
        role: formData.role,
      };

      if (formData.role === "ALUNO") {
        payload.matricula = formData.matricula;
        payload.curso = formData.curso;
        if (formData.dataIngresso) {
          payload.dataIngresso = formData.dataIngresso;
        }
      }

      if (
        formData.role === "PROFESSOR" ||
        formData.role === "PROFESSOR_BANCA" ||
        formData.role === "COORDENADOR"
      ) {
        if (formData.titulacao) payload.titulacao = formData.titulacao;
        if (formData.departamento) payload.departamento = formData.departamento;
        if (formData.areaAtuacao) payload.areaAtuacao = formData.areaAtuacao;
        if (formData.lattes) payload.lattes = formData.lattes;
      }

      const response = await fetch("/api/usuarios/cadastrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast("Usuário cadastrado com sucesso!", "success");
        setTimeout(() => router.push("/usuarios"), 1000);
      } else {
        const error = await response.json();
        showToast(error.error || "Erro ao cadastrar usuário", "error");
      }
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      showToast("Erro de conexão ao cadastrar usuário", "error");
    } finally {
      setLoading(false);
    }
  };

  const isAluno = formData.role === "ALUNO";
  const isProfessor =
    formData.role === "PROFESSOR" ||
    formData.role === "PROFESSOR_BANCA" ||
    formData.role === "COORDENADOR";

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
              Integrar <span className="bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] bg-clip-text text-transparent italic">Novo Talento</span>
            </h1>
            <p className="text-[var(--muted)] text-lg font-medium max-w-2xl mx-auto">
              Configure as credenciais e o papel acadêmico para o novo integrante do ecossistema SIGBANCA.
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
                 <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">Perfil Base</h2>
                <p className="text-[var(--muted)] font-medium">Informações fundamentais de identificação.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Nome Completo *</label>
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
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">E-mail Acadêmico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@instituicao.edu.br"
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">CPF *</label>
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
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Contato Telefônico</label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Atribuição de Papel *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)] appearance-none"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Chave de Acesso *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="••••••••"
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
                   <Save className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">Trajetória Específica</h2>
                  <p className="text-[var(--muted)] font-medium">Detalhes sobre a atuação na instituição.</p>
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
              Cancelar Cadastro
            </button>
            <button
              type="submit"
              disabled={loading}
              className="relative group overflow-hidden px-16 py-6 bg-[var(--foreground)] text-white rounded-[24px] font-black text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl shadow-black/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-3">
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-6 h-6" />
                )}
                <span>{loading ? "Processando..." : "Confirmar Integração"}</span>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
