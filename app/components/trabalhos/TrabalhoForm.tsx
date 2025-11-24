"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { Button } from "@/app/components/ui/Button";
import { VALIDATION_CONFIG, VALIDATION_MESSAGES, FILE_CONFIG } from "@/app/config";
import { FileUp, Link as LinkIcon } from "lucide-react";
import { TipoDocumento, PlataformaExterna } from "@/app/types";

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
        "success"
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Título do Trabalho *
        </label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Digite o título do trabalho"
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descrição *
        </label>
        <textarea
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Descreva o trabalho"
        />
      </div>

      {/* Curso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Curso *
        </label>
        <input
          type="text"
          value={formData.curso}
          onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Ex: Engenharia de Software, Sistemas de Informação..."
        />
      </div>

      {/* Aluno - apenas se for COORDENADOR ou ADMIN */}
      {(usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aluno *
          </label>
          <select
            value={formData.alunoId}
            onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
            disabled={isLoadingAlunos}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {isLoadingAlunos ? "Carregando alunos..." : "Selecione um aluno"}
            </option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome} - {aluno.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Orientador */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Orientador *
        </label>
        <select
          value={formData.orientadorId}
          onChange={(e) => setFormData({ ...formData, orientadorId: e.target.value })}
          disabled={isLoadingProfessores}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">
            {isLoadingProfessores ? "Carregando professores..." : "Selecione um orientador"}
          </option>
          {professores.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.titulacao ? `${prof.titulacao} ` : ""}
              {prof.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Data de Início */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Data de Início *
        </label>
        <input
          type="date"
          value={formData.dataInicio}
          onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Upload de Arquivo ou Link - apenas na criação */}
      {!trabalhoId && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Primeira Versão do Documento *
          </label>

          {/* Seletor de tipo: Arquivo ou URL */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipoVersao"
                value="ARQUIVO"
                checked={tipoVersao === "ARQUIVO"}
                onChange={() => setTipoVersao("ARQUIVO")}
                className="w-4 h-4 text-blue-600"
              />
              <FileUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Arquivo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tipoVersao"
                value="URL_EXTERNA"
                checked={tipoVersao === "URL_EXTERNA"}
                onChange={() => setTipoVersao("URL_EXTERNA")}
                className="w-4 h-4 text-blue-600"
              />
              <LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Link Externo</span>
            </label>
          </div>

          {/* Campos para ARQUIVO */}
          {tipoVersao === "ARQUIVO" && (
            <div>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept={FILE_CONFIG.ACCEPT_STRING}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > FILE_CONFIG.MAX_SIZE) {
                        showToast(FILE_CONFIG.ERRORS.TOO_LARGE, "error");
                        e.target.value = "";
                        return;
                      }

                      // Validar extensão do arquivo
                      const ext = file.name.split(".").pop()?.toLowerCase();
                      const allowedExt = FILE_CONFIG.ALLOWED_EXTENSIONS.map((e) =>
                        e.replace(".", "")
                      );
                      if (!ext || !allowedExt.includes(ext)) {
                        showToast(FILE_CONFIG.ERRORS.INVALID_TYPE, "error");
                        e.target.value = "";
                        return;
                      }

                      setArquivo(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
                />
              </div>
              {arquivo && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Arquivo selecionado: {arquivo.name} ({(arquivo.size / 1024 / 1024).toFixed(2)}{" "}
                  MB)
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Formatos aceitos: PDF, DOC, DOCX (máx. {FILE_CONFIG.MAX_SIZE_MB}MB)
              </p>
            </div>
          )}

          {/* Campos para URL_EXTERNA */}
          {tipoVersao === "URL_EXTERNA" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Documento *
                </label>
                <input
                  type="url"
                  value={urlExterna}
                  onChange={(e) => setUrlExterna(e.target.value)}
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Cole o link de compartilhamento do documento
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Plataforma
                </label>
                <select
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value as PlataformaExterna)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {PLATAFORMAS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título do Documento *
                </label>
                <input
                  type="text"
                  value={tituloDocumento}
                  onChange={(e) => setTituloDocumento(e.target.value)}
                  placeholder="Ex: TCC - Versão Inicial"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push("/trabalhos")}>
          Cancelar
        </Button>
        <Button type="submit" variant="gradient" isLoading={isLoading}>
          {trabalhoId ? "Atualizar Trabalho" : "Criar Trabalho"}
        </Button>
      </div>
    </form>
  );
}
