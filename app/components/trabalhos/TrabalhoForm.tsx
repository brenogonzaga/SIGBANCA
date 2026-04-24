"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";
import { VALIDATION_CONFIG, VALIDATION_MESSAGES, FILE_CONFIG } from "@/app/config";
import {
  FileUp,
  Link as LinkIcon,
  User,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  CalendarPlus,
  CheckCircle,
} from "lucide-react";
import { TipoDocumento, PlataformaExterna } from "@/app/types";
import Link from "next/link";

// Opções de plataformas externas
const PLATAFORMAS_OPTIONS: { value: PlataformaExterna; label: string }[] = [
  { value: "google_docs", label: "Google Docs" },
  { value: "google_drive", label: "Google Drive" },
  { value: "onedrive", label: "OneDrive" },
  { value: "dropbox", label: "Dropbox" },
  { value: "overleaf", label: "Overleaf" },
  { value: "notion", label: "Notion" },
  { value: "outro", label: "Outro" },
];

interface TrabalhoFormProps {
  trabalhoId?: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  titulacao?: string | null;
}

export default function TrabalhoForm({ trabalhoId }: TrabalhoFormProps) {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfessores, setIsLoadingProfessores] = useState(true);
  const [isLoadingAlunos, setIsLoadingAlunos] = useState(true);
  const [professores, setProfessores] = useState<Usuario[]>([]);
  const [alunos, setAlunos] = useState<Usuario[]>([]);
  const [banca, setBanca] = useState<{
    id: string;
    data: string;
    horario: string;
    local: string;
    modalidade: string;
    status: string;
    membros: Array<{
      papel: string;
      usuario: { id: string; nome: string; titulacao?: string };
    }>;
  } | null>(null);

  // Tipo de versão inicial: arquivo ou URL
  const [tipoVersao, setTipoVersao] = useState<TipoDocumento>("ARQUIVO");
  const [arquivo, setArquivo] = useState<File | null>(null);
  // Campos para URL externa
  const [urlExterna, setUrlExterna] = useState("");
  const [plataforma, setPlataforma] = useState<PlataformaExterna>("google_docs");
  const [tituloDocumento, setTituloDocumento] = useState("");

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    curso: "",
    alunoId: "",
    orientadorId: "",
    dataInicio: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadProfessores();
    if (usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN") {
      loadAlunos();
    } else if (usuario?.role === "ALUNO") {
      setFormData((prev) => ({ ...prev, alunoId: usuario.id }));
    }
    if (trabalhoId) {
      loadTrabalho();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabalhoId]);

  async function loadProfessores() {
    setIsLoadingProfessores(true);
    try {
      const response = await fetch("/api/usuarios?role=PROFESSOR", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfessores(data);
      } else if (response.status === 401) {
        showToast("Sessão expirada. Faça login novamente", "warning");
        router.push("/login");
      } else if (response.status === 403) {
        showToast("Sem permissão para acessar professores", "error");
      } else {
        showToast("Erro ao carregar professores", "error");
      }
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
      showToast("Erro de conexão ao carregar professores", "error");
    } finally {
      setIsLoadingProfessores(false);
    }
  }

  async function loadAlunos() {
    setIsLoadingAlunos(true);
    try {
      const response = await fetch("/api/usuarios?role=ALUNO", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAlunos(data);
      } else if (response.status === 401) {
        showToast("Sessão expirada. Faça login novamente", "warning");
        router.push("/login");
      } else if (response.status === 403) {
        showToast("Sem permissão para acessar alunos", "error");
      } else {
        showToast("Erro ao carregar alunos", "error");
      }
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      showToast("Erro de conexão ao carregar alunos", "error");
    } finally {
      setIsLoadingAlunos(false);
    }
  }

  async function loadTrabalho() {
    try {
      const response = await fetch(`/api/trabalhos/${trabalhoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const trabalho = await response.json();
        setFormData({
          titulo: trabalho.titulo,
          descricao: trabalho.descricao,
          curso: trabalho.curso,
          alunoId: trabalho.alunoId,
          orientadorId: trabalho.orientadorId,
          dataInicio: new Date(trabalho.dataInicio).toISOString().split("T")[0],
        });
        if (trabalho.banca) {
          setBanca(trabalho.banca);
        }
      } else if (response.status === 401) {
        showToast("Sessão expirada. Faça login novamente", "warning");
        router.push("/login");
      } else if (response.status === 403) {
        showToast("Sem permissão para acessar este trabalho", "error");
        router.push("/trabalhos");
      } else if (response.status === 404) {
        showToast("Trabalho não encontrado", "error");
        router.push("/trabalhos");
      } else {
        showToast("Erro ao carregar trabalho", "error");
      }
    } catch (error) {
      console.error("Erro ao carregar trabalho:", error);
      showToast("Erro de conexão ao carregar trabalho", "error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Verificar autenticação
    if (!token) {
      showToast("Sessão expirada. Faça login novamente", "warning");
      router.push("/login");
      return;
    }

    if (!formData.titulo.trim()) {
      showToast(VALIDATION_MESSAGES.TRABALHO.TITULO_REQUIRED, "error");
      return;
    }
    if (formData.titulo.trim().length < VALIDATION_CONFIG.TRABALHO.TITULO.MIN) {
      showToast(VALIDATION_MESSAGES.TRABALHO.TITULO_MIN, "error");
      return;
    }
    if (formData.titulo.trim().length > VALIDATION_CONFIG.TRABALHO.TITULO.MAX) {
      showToast(VALIDATION_MESSAGES.TRABALHO.TITULO_MAX, "error");
      return;
    }
    if (!formData.descricao.trim()) {
      showToast(VALIDATION_MESSAGES.TRABALHO.DESCRICAO_REQUIRED, "error");
      return;
    }
    if (formData.descricao.trim().length < VALIDATION_CONFIG.TRABALHO.DESCRICAO.MIN) {
      showToast(VALIDATION_MESSAGES.TRABALHO.DESCRICAO_MIN, "error");
      return;
    }
    if (formData.descricao.trim().length > VALIDATION_CONFIG.TRABALHO.DESCRICAO.MAX) {
      showToast(VALIDATION_MESSAGES.TRABALHO.DESCRICAO_MAX, "error");
      return;
    }
    if (!formData.curso.trim()) {
      showToast(VALIDATION_MESSAGES.TRABALHO.CURSO_REQUIRED, "error");
      return;
    }
    if (formData.curso.trim().length < VALIDATION_CONFIG.TRABALHO.CURSO.MIN) {
      showToast(VALIDATION_MESSAGES.TRABALHO.CURSO_MIN, "error");
      return;
    }
    if (!formData.alunoId) {
      showToast(VALIDATION_MESSAGES.TRABALHO.ALUNO_REQUIRED, "error");
      return;
    }
    if (!formData.orientadorId) {
      showToast(VALIDATION_MESSAGES.TRABALHO.ORIENTADOR_REQUIRED, "error");
      return;
    }

    // Validação da versão inicial (arquivo ou URL)
    if (!trabalhoId) {
      if (tipoVersao === "ARQUIVO") {
        if (!arquivo) {
          showToast(VALIDATION_MESSAGES.TRABALHO.ARQUIVO_REQUIRED, "error");
          return;
        }
      } else {
        // URL_EXTERNA
        if (!urlExterna.trim()) {
          showToast("Digite a URL do documento", "error");
          return;
        }
        if (!tituloDocumento.trim()) {
          showToast("Digite o título do documento", "error");
          return;
        }
        // Validação simples de URL
        try {
          new URL(urlExterna);
        } catch {
          showToast("URL inválida. Informe uma URL completa (ex: https://...)", "error");
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      const url = trabalhoId ? `/api/trabalhos/${trabalhoId}` : "/api/trabalhos";
      const method = trabalhoId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = "Erro ao salvar trabalho"; // Mensagens específicas por status HTTP
        if (response.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente";
        } else if (response.status === 403) {
          errorMessage = "Você não tem permissão para criar/editar trabalhos";
        } else if (response.status === 400) {
          errorMessage = error.error || "Dados inválidos. Verifique os campos";
        } else if (error.error) {
          errorMessage = error.error;
        }

        throw new Error(errorMessage);
      }

      const trabalhoData = await response.json();

      // Upload da versão inicial (arquivo ou URL)
      if (!trabalhoId) {
        let uploadResponse: Response;

        if (tipoVersao === "ARQUIVO" && arquivo) {
          const uploadFormData = new FormData();
          uploadFormData.append("arquivo", arquivo);
          uploadFormData.append("trabalhoId", trabalhoData.id);
          uploadFormData.append("changelog", "Versão inicial");

          uploadResponse = await fetch("/api/versoes", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          });
        } else {
          // URL externa
          uploadResponse = await fetch("/api/versoes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              tipoDocumento: "URL_EXTERNA",
              trabalhoId: trabalhoData.id,
              urlExterna: urlExterna.trim(),
              plataforma,
              tituloDocumento: tituloDocumento.trim(),
              changelog: "Versão inicial",
            }),
          });
        }

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          let errorMessage = "Erro ao salvar documento inicial";

          if (uploadResponse.status === 400) {
            errorMessage = uploadError.error || "Dados inválidos. Verifique tamanho e formato";
          }

          throw new Error(errorMessage);
        }
      }

      showToast(
        trabalhoId ? "Trabalho atualizado com sucesso!" : "Trabalho criado com sucesso!",
        "success",
      );
      router.push("/trabalhos");
    } catch (error) {
      let errorMessage = "Erro ao salvar trabalho";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && String(error).includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[#7C3AED] to-emerald-500 rounded-full opacity-50"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Título - High Impact */}
        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
            Título da Pesquisa / Projeto <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="w-full px-8 py-6 bg-[var(--surface)] border-2 border-[var(--border)] rounded-[32px] focus:ring-8 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted-light)] font-black text-2xl md:text-3xl tracking-tight shadow-sm"
            placeholder="Ex: Paradigmas Sócio-Econômicos no Século XXI"
          />
        </div>

        {/* Descrição - Text Area with Elevation */}
        <div className="md:col-span-2 space-y-4">
          <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
            Resumo Executivo <span className="text-[var(--danger)]">*</span>
          </label>
          <div className="relative group">
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={6}
              className="w-full px-8 py-6 bg-[var(--surface)] border-2 border-[var(--border)] rounded-[32px] focus:ring-8 focus:ring-[var(--primary)]/5 focus:border-[var(--primary)] outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted-light)] font-medium leading-relaxed shadow-sm resize-none"
              placeholder="Descreva os objetivos principais, metodologia e resultados esperados..."
            />
          </div>
        </div>

        {/* Informações Básicas Card */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-[var(--surface-light)]/40 backdrop-blur-sm rounded-[44px] border border-[var(--border)] border-dashed">
          {/* Curso */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
              Linha de Pesquisa / Curso
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--primary)]">
                <BookOpen className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={formData.curso}
                onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                className="w-full pl-14 pr-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--foreground)]"
                placeholder="Engenharia de Sistemas"
              />
            </div>
          </div>

          {/* Data de Início */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
              Inauguração do Projeto
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-light)]">
                <Calendar className="w-5 h-5" />
              </div>
              <input
                type="date"
                value={formData.dataInicio}
                onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                className="w-full pl-14 pr-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--foreground)]"
              />
            </div>
          </div>

          {/* Aluno Selector (Conditional) */}
          {(usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN") && (
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
                Titular do Trabalho
              </label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--primary)]">
                  <User className="w-5 h-5" />
                </div>
                <select
                  value={formData.alunoId}
                  onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
                  disabled={isLoadingAlunos}
                  className="w-full pl-14 pr-10 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl appearance-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--foreground)] disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingAlunos ? "Identificando..." : "Selecione o autor"}
                  </option>
                  {alunos.map((aluno) => (
                    <option key={aluno.id} value={aluno.id}>
                      {aluno.nome}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted-light)]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>
          )}

          {/* Orientador Selector */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
              Docente Orientador
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-light)]">
                <User className="w-5 h-5" />
              </div>
              <select
                value={formData.orientadorId}
                onChange={(e) => setFormData({ ...formData, orientadorId: e.target.value })}
                disabled={isLoadingProfessores}
                className="w-full pl-14 pr-10 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl appearance-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-bold text-[var(--foreground)] disabled:opacity-50"
              >
                <option value="">
                  {isLoadingProfessores ? "Mapeando..." : "Selecione o orientador"}
                </option>
                {professores.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.titulacao ? `${prof.titulacao} ` : ""}
                    {prof.nome}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--primary)]">
                <FileUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entrega Inicial - Bento Section */}
      {!trabalhoId && (
        <div className="pt-12 border-t border-[var(--border-light)]">
          <div className="bg-[var(--surface)] p-8 md:p-12 rounded-[48px] border border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                  <FileUp className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                    Material de Estreia
                  </h3>
                  <p className="text-[var(--muted)] font-medium">
                    Anexe o arquivo mestre ou um repositório externo.
                  </p>
                </div>
              </div>

              <div className="flex bg-[var(--surface-light)]/50 p-1.5 rounded-[20px] border border-[var(--border)] backdrop-blur shadow-sm">
                <button
                  type="button"
                  onClick={() => setTipoVersao("ARQUIVO")}
                  className={`flex items-center gap-3 px-6 py-3 rounded-[16px] text-[10px] font-black transition-all duration-300 ${
                    tipoVersao === "ARQUIVO"
                      ? "bg-[var(--foreground)] text-white shadow-xl"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  ARQUIVO LOCAL
                </button>
                <button
                  type="button"
                  onClick={() => setTipoVersao("URL_EXTERNA")}
                  className={`flex items-center gap-3 px-6 py-3 rounded-[16px] text-[10px] font-black transition-all duration-300 ${
                    tipoVersao === "URL_EXTERNA"
                      ? "bg-[var(--foreground)] text-white shadow-xl"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  LINK DINÂMICO
                </button>
              </div>
            </div>

            <div className="min-h-[200px] flex flex-col justify-center animate-in zoom-in-95 duration-500">
              {tipoVersao === "ARQUIVO" ? (
                <div
                  className={`relative group border-[3px] border-dashed rounded-[32px] p-12 transition-all flex flex-col items-center text-center ${
                    arquivo
                      ? "border-emerald-500/50 bg-emerald-500/5"
                      : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/10"
                  }`}
                >
                  <input
                    type="file"
                    accept={FILE_CONFIG.ACCEPT_STRING}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > FILE_CONFIG.MAX_SIZE) {
                          showToast(FILE_CONFIG.ERRORS.TOO_LARGE, "error");
                          return;
                        }
                        setArquivo(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />

                  <div
                    className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${
                      arquivo
                        ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                        : "bg-[var(--surface-light)] text-[var(--muted-light)] shadow-inner"
                    }`}
                  >
                    <FileUp className="w-9 h-9" />
                  </div>

                  {arquivo ? (
                    <div className="space-y-1">
                      <p className="text-xl font-black text-[var(--foreground)] tracking-tight">
                        {arquivo.name}
                      </p>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full inline-block">
                        {(arquivo.size / 1024 / 1024).toFixed(2)} MB • Mapeado e Pronto
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-black text-[var(--foreground)]">
                        Drop do Documento Mestre
                      </p>
                      <p className="text-sm font-medium text-[var(--muted)]">
                        Suporta PDF, DOCX e formatos acadêmicos até {FILE_CONFIG.MAX_SIZE_MB}MB
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
                      Ecossistema / Plataforma
                    </label>
                    <select
                      value={plataforma}
                      onChange={(e) => setPlataforma(e.target.value as any)}
                      className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)] shadow-sm"
                    >
                      {PLATAFORMAS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
                      Rótulo da Entrega
                    </label>
                    <input
                      type="text"
                      value={tituloDocumento}
                      onChange={(e) => setTituloDocumento(e.target.value)}
                      placeholder="Ex: Draft Inicial v1.0"
                      className="w-full px-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-bold text-[var(--foreground)] shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
                      Endereço do Recurso (URL)
                    </label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--primary)]">
                        <LinkIcon className="w-5 h-5" />
                      </div>
                      <input
                        type="url"
                        value={urlExterna}
                        onChange={(e) => setUrlExterna(e.target.value)}
                        placeholder="https://cloud.university.edu/share/..."
                        className="w-full pl-14 pr-6 py-5 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 outline-none transition-all font-medium text-[var(--foreground)] shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Banca / Avaliadores — visível somente no modo de edição para professor/admin */}
      {trabalhoId &&
        (usuario?.role === "PROFESSOR" ||
          usuario?.role === "ADMIN" ||
          usuario?.role === "COORDENADOR") && (
          <div className="pt-12 border-t border-[var(--border-light)] relative z-10">
            <div className="p-8 md:p-10 bg-amber-500/5 rounded-[44px] border border-amber-500/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                      Banca Examinadora
                    </h3>
                    <p className="text-[var(--muted)] font-medium">
                      {banca
                        ? `${banca.membros.length} membro(s) registrado(s) — ${banca.status}`
                        : "Nenhuma banca agendada ainda. Registre os avaliadores a qualquer momento."}
                    </p>
                  </div>
                </div>
                <Link
                  href={
                    banca
                      ? `/bancas/${banca.id}/editar`
                      : `/bancas/cadastrar?trabalhoId=${trabalhoId}`
                  }
                >
                  <button
                    type="button"
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500 text-white font-black text-xs hover:shadow-xl hover:shadow-amber-500/20 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    {banca ? "Editar Banca" : "Agendar / Registrar Membros"}
                  </button>
                </Link>
              </div>

              {banca && banca.membros.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {banca.membros.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-4 bg-[var(--background)] rounded-2xl border border-[var(--border)]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-black text-sm flex-shrink-0">
                        {m.usuario.nome.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[var(--foreground)] truncate">
                          {m.usuario.titulacao ? `${m.usuario.titulacao} ` : ""}
                          {m.usuario.nome}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                          {m.papel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[var(--muted)] text-sm font-medium p-4 bg-[var(--background)]/50 rounded-2xl border border-dashed border-[var(--border)]">
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                  Clique em &quot;Agendar / Registrar Membros&quot; para definir os avaliadores.
                  Eles terão acesso ao andamento do trabalho imediatamente.
                </div>
              )}

              {banca && (
                <div className="mt-6 pt-5 border-t border-amber-500/10 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-light)]">
                      Data
                    </p>
                    <p className="font-bold text-[var(--foreground)] text-sm mt-1">
                      {new Date(banca.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-light)]">
                      Horário
                    </p>
                    <p className="font-bold text-[var(--foreground)] text-sm mt-1">
                      {banca.horario}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-light)]">
                      Local
                    </p>
                    <p className="font-bold text-[var(--foreground)] text-sm mt-1 truncate">
                      {banca.local}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Botões - Elite Footer */}
      <div className="flex items-center justify-between pt-10 border-t border-[var(--border-light)] relative z-10">
        <button
          type="button"
          onClick={() => router.push("/trabalhos")}
          className="px-10 py-5 text-xs font-black text-[var(--muted)] hover:text-[var(--foreground)] transition-all uppercase tracking-widest bg-[var(--background)] border border-[var(--border)] rounded-2xl hover:bg-[var(--surface-light)]"
        >
          Descartar Rascunho
        </button>
        <div className="flex gap-6">
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            isLoading={isLoading}
            className="rounded-[24px] px-16 py-8 text-lg font-black shadow-2xl shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:-translate-y-1 transition-all"
          >
            {trabalhoId ? "Consolidar Alterações" : "Iniciar Trajetória"}
          </Button>
        </div>
      </div>
    </form>
  );
}
