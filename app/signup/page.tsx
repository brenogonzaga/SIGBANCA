"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/Button";
import { VALIDATION_CONFIG, VALIDATION_MESSAGES } from "@/app/config";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  Phone, 
  IdCard,
  ArrowRight,
  Sparkles,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Logo } from "@/app/components/ui/Logo";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    confirmSenha: "",
    nome: "",
    role: "ALUNO",
    cpf: "",
    telefone: "",
    matricula: "",
    curso: "",
    titulacao: "",
    departamento: "",
    areaAtuacao: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.senha !== formData.confirmSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.senha.length < VALIDATION_CONFIG.USUARIO.SENHA.MIN) {
      setError(VALIDATION_MESSAGES.USUARIO.SENHA_MIN);
      return;
    }

    setIsLoading(true);

    try {
      const { confirmSenha, ...dataToSend } = formData;
      await signup(dataToSend);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const isAluno = formData.role === "ALUNO";
  const isProfessor = ["PROFESSOR", "PROFESSOR_BANCA", "COORDENADOR"].includes(formData.role);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col md:flex-row relative overflow-hidden">
      {/* Visual Identity Section (Left) */}
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-[var(--foreground)] to-black relative overflow-hidden p-16 flex-col justify-between border-r border-white/10">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.05]"></div>
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 animate-fade-in">
          <Logo size="lg" className="invert" />
          <div className="mt-24 space-y-8">
            <h2 className="text-5xl font-black text-white leading-tight tracking-tight font-[Plus\ Jakarta\ Sans]">
              Dê vida à sua <br />
              <span className="bg-gradient-to-r from-[var(--primary-light)] to-[#A78BFA] bg-clip-text text-transparent italic">Jornada Acadêmica</span>
            </h2>
            <p className="text-gray-400 text-lg font-medium max-w-sm leading-relaxed">
              O ecossistema definitivo para gestão de trabalhos de conclusão e comissões avaliadoras.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-8 animate-slide-in-up">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-8 h-8 text-[var(--primary-light)] mb-4" />
              <p className="text-white font-black text-sm uppercase tracking-widest">Protocolo Seguro</p>
              <p className="text-gray-500 text-xs mt-1">Dados criptografados</p>
            </div>
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-amber-400 mb-4" />
              <p className="text-white font-black text-sm uppercase tracking-widest">IA Integrada</p>
              <p className="text-gray-500 text-xs mt-1">Análise preditiva</p>
            </div>
          </div>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
            SIGBANCA • EXCELLENCE IN RESEARCH
          </p>
        </div>
      </div>

      {/* Form Section (Right) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-xl animate-fade-in">
          <div className="lg:hidden mb-12 text-center">
             <Logo size="md" className="inline-flex" />
          </div>

          <div className="space-y-2 mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight">Candidatura ao Sistema</h1>
            <p className="text-[var(--muted)] font-medium">Preencha suas credenciais para acessar o portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-[24px] text-sm font-bold flex items-center gap-4 animate-shake">
                <div className="p-2 bg-red-100 rounded-lg">
                   <AlertCircle className="w-4 h-4" />
                </div>
                {error}
              </div>
            )}

            {/* Role Switcher */}
            <div className="bg-[var(--surface-light)]/50 p-2 rounded-[28px] border border-[var(--border-light)] flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: "ALUNO"})}
                className={`flex-1 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all ${isAluno ? 'bg-[var(--foreground)] text-white shadow-xl scale-[1.02]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              >
                Discente
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: "PROFESSOR"})}
                className={`flex-1 py-4 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all ${isProfessor ? 'bg-[var(--foreground)] text-white shadow-xl scale-[1.02]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}
              >
                Docente
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Nome Acadêmico</label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Endereço de Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                    placeholder="email@instituicao.edu"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Senha de Acesso</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    type="password"
                    required
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Confirmar Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    type="password"
                    required
                    value={formData.confirmSenha}
                    onChange={(e) => setFormData({ ...formData, confirmSenha: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">CPF (Obrigatório p/ Bancas)</label>
                <div className="relative group">
                  <IdCard className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Telefone / Celular</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Content */}
            <div className="pt-6 border-t border-[var(--border-light)] border-dashed space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               {isAluno ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Matrícula Acadêmica</label>
                      <div className="relative group">
                        <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                          type="text"
                          value={formData.matricula}
                          onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                          className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Curso de Matrícula</label>
                      <div className="relative group">
                        <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)] group-focus-within:text-[var(--primary)] transition-colors" />
                        <input
                          type="text"
                          value={formData.curso}
                          onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                          className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                        />
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Titulação Docente</label>
                        <div className="relative group">
                          <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
                          <select
                            value={formData.titulacao}
                            onChange={(e) => setFormData({ ...formData, titulacao: e.target.value })}
                            className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Selecione Titulação</option>
                            <option value="Esp.">Especialista</option>
                            <option value="MSc.">Mestre</option>
                            <option value="Dr.">Doutor</option>
                            <option value="Pós-Doc.">Pós-Doutor</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Departamento</label>
                        <div className="relative group">
                          <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
                          <input
                            type="text"
                            value={formData.departamento}
                            onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                            className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest pl-1">Linha de Pesquisa / Área de Atuação</label>
                      <div className="relative group">
                        <Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]" />
                        <input
                          type="text"
                          value={formData.areaAtuacao}
                          onChange={(e) => setFormData({ ...formData, areaAtuacao: e.target.value })}
                          className="w-full pl-12 pr-5 py-4 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all text-sm font-bold"
                          placeholder="Ex: Inteligência Artificial, Engenharia de Software..."
                        />
                      </div>
                    </div>
                 </div>
               )}
            </div>

            <Button 
              type="submit" 
              variant="gradient" 
              size="lg" 
              disabled={isLoading} 
              className="w-full py-7 rounded-[24px] shadow-2xl shadow-[var(--primary)]/20 text-md font-black uppercase tracking-[0.2em] group"
            >
              {isLoading ? "Processando..." : (
                <span className="flex items-center gap-3">
                  Finalizar Candidatura <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm font-medium text-[var(--muted)]">
                Já possui credenciais?{" "}
                <Link href="/login" className="text-[var(--foreground)] font-black hover:text-[var(--primary)] transition-colors inline-flex items-center gap-1 group">
                  Acessar conta <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
