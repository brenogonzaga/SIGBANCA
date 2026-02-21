"use client";

import React, { useState } from "react";
import { Trabalho, PlataformaExterna, TipoDocumento, Comentario } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { FILE_CONFIG, VALIDATION_MESSAGES } from "@/app/config";
import {
  FileText,
  User,
  Calendar,
  Download,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  FileUp,
  X,
  Link as LinkIcon,
  ExternalLink,
  Edit,
  Trash2,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect } from "react";

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

interface TrabalhoDetailProps {
  trabalho: Trabalho;
  onBack?: () => void;
  onUpdate?: () => void;
}

export function TrabalhoDetail({ trabalho, onBack, onUpdate }: TrabalhoDetailProps) {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const [versaoExpandida, setVersaoExpandida] = useState<string | null>(
    trabalho.versoes[trabalho.versoes.length - 1]?.id || null
  );
  const [novoComentario, setNovoComentario] = useState<{ [key: string]: string }>({});
  const [isAddingComment, setIsAddingComment] = useState<{ [key: string]: boolean }>({});
  // Estado de edição de comentários
  const [comentarioEditando, setComentarioEditando] = useState<{ id: string; texto: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingComentarioId, setDeletingComentarioId] = useState<string | null>(null);
  // Estado de avaliação
  const [minhaAvaliacao, setMinhaAvaliacao] = useState<{ nota: string; parecer: string }>({
    nota: "",
    parecer: "",
  });
  const [avaliacoes, setAvalocoes] = useState<Array<{
    id: string;
    membro: { id: string; nome: string; titulacao?: string; papel: string };
    nota: number;
    parecer: string;
    dataAvaliacao: string;
  }>>([]);
  const [isSubmittingAvaliacao, setIsSubmittingAvaliacao] = useState(false);
  const [jaAvaliou, setJaAvaliou] = useState(false);

  const meuMembroId = trabalho.banca?.membros.find(
    (m) => m.usuario.id === usuario?.id
  )?.id;
  const isMembro = !!meuMembroId;
  const bancaAtiva =
    trabalho.banca?.status === "AGENDADA" || trabalho.banca?.status === "EM_ANDAMENTO";
  const bancaRealizada = trabalho.banca?.status === "REALIZADA";
  const podeVerAvaliacoes =
    bancaRealizada &&
    (usuario?.role === "ADMIN" ||
      usuario?.role === "COORDENADOR" ||
      trabalho.aluno?.id === usuario?.id ||
      trabalho.orientador?.id === usuario?.id ||
      isMembro);

  useEffect(() => {
    if (!trabalho.banca || !podeVerAvaliacoes) return;
    fetch(`/api/avaliacoes?bancaId=${trabalho.banca.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setAvalocoes(data.avaliacoes || []);
        if (isMembro) {
          const jaFez = data.avaliacoes?.some(
            (a: { membro: { id: string } }) => a.membro.id === usuario?.id
          );
          setJaAvaliou(!!jaFez);

          // Preencher campos com avaliação existente se membro já avaliou
          const minhaAv = data.avaliacoes?.find(
            (a: { membro: { id: string }; nota: number; parecer: string }) => a.membro.id === usuario?.id
          );
          if (minhaAv) {
            setMinhaAvaliacao({ nota: String(minhaAv.nota), parecer: minhaAv.parecer });
          }
        }
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabalho.banca?.id, podeVerAvaliacoes]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  // Tipo de upload: arquivo ou URL
  const [tipoUpload, setTipoUpload] = useState<TipoDocumento>("ARQUIVO");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  // Campos para URL externa
  const [urlExterna, setUrlExterna] = useState("");
  const [plataforma, setPlataforma] = useState<PlataformaExterna>("google_docs");
  const [tituloDocumento, setTituloDocumento] = useState("");
  const [uploadChangelog, setUploadChangelog] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCloseUploadModal = () => {
    const hasFileData = uploadFile !== null;
    const hasUrlData = urlExterna.trim() !== "" || tituloDocumento.trim() !== "";
    const hasData = hasFileData || hasUrlData || uploadChangelog.trim() !== "";

    if (hasData) {
      if (window.confirm("Você tem dados não salvos. Deseja realmente fechar?")) {
        resetUploadModal();
      }
    } else {
      resetUploadModal();
    }
  };

  const resetUploadModal = () => {
    setShowUploadModal(false);
    setTipoUpload("ARQUIVO");
    setUploadFile(null);
    setUrlExterna("");
    setPlataforma("google_docs");
    setTituloDocumento("");
    setUploadChangelog("");
  };

  const canUpload =
    usuario?.role === "ADMIN" ||
    usuario?.role === "COORDENADOR" ||
    trabalho.aluno.id === usuario?.id ||
    trabalho.orientador.id === usuario?.id;

  const toggleVersao = (versaoId: string) => {
    setVersaoExpandida(versaoExpandida === versaoId ? null : versaoId);
  };

  const handleDownload = async (
    versaoId: string,
    nomeArquivo: string,
    urlExternaVersao?: string
  ) => {
    // Se for URL externa, abrir diretamente
    if (urlExternaVersao) {
      window.open(urlExternaVersao, "_blank");
      showToast("Abrindo documento externo...", "success");
      return;
    }

    setDownloadingId(versaoId);
    try {
      const response = await fetch(`/api/versoes/${versaoId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        const newWindow = window.open(data.downloadUrl, "_blank");

        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
          showToast("Popup bloqueado. Clique no link para baixar o arquivo", "warning");
          const link = document.createElement("a");
          link.href = data.downloadUrl;
          link.target = "_blank";
          link.download = nomeArquivo;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          showToast(`Download de ${nomeArquivo} iniciado com sucesso!`, "success");
        }
      } else {
        const error = await response.json();
        showToast(error.error || "Erro ao baixar arquivo", "error");
      }
    } catch (error) {
      console.error("Erro ao baixar:", error);
      showToast("Erro ao baixar arquivo. Verifique sua conexão", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAddComment = async (versaoId: string) => {
    const texto = novoComentario[versaoId];
    if (!texto || !texto.trim()) {
      showToast(VALIDATION_MESSAGES.COMENTARIO.TEXTO_REQUIRED, "warning");
      return;
    }

    setIsAddingComment({ ...isAddingComment, [versaoId]: true });

    try {
      const response = await fetch("/api/comentarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          texto,
          versaoId,
        }),
      });

      if (response.ok) {
        await response.json();
        showToast("Comentário adicionado com sucesso!", "success");
        setNovoComentario({ ...novoComentario, [versaoId]: "" });

        if (onUpdate) {
          onUpdate();
        }
      } else {
        const error = await response.json();
        const errorMessage = error.error || "Erro ao adicionar comentário";
        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      let errorMessage = "Erro ao adicionar comentário";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet";
      }

      showToast(errorMessage, "error");
    } finally {
      setIsAddingComment({ ...isAddingComment, [versaoId]: false });
    }
  };

  const handleEditarComentario = async () => {
    if (!comentarioEditando || !comentarioEditando.texto.trim()) return;
    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/comentarios?id=${comentarioEditando.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ texto: comentarioEditando.texto }),
      });
      if (response.ok) {
        showToast("Comentário atualizado!", "success");
        setComentarioEditando(null);
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        showToast(error.error || "Erro ao editar comentário", "error");
      }
    } catch {
      showToast("Erro de conexão ao editar comentário", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletarComentario = async (comentarioId: string) => {
    setDeletingComentarioId(comentarioId);
    try {
      const response = await fetch(`/api/comentarios?id=${comentarioId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showToast("Comentário excluído!", "success");
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        showToast(error.error || "Erro ao excluir comentário", "error");
      }
    } catch {
      showToast("Erro de conexão ao excluir comentário", "error");
    } finally {
      setDeletingComentarioId(null);
    }
  };

  const handleUploadNewVersion = async () => {
    // Validação baseada no tipo de upload
    if (tipoUpload === "ARQUIVO") {
      if (!uploadFile) {
        showToast("Selecione um arquivo", "warning");
        return;
      }
    } else {
      // URL_EXTERNA
      if (!urlExterna.trim()) {
        showToast("Digite a URL do documento", "warning");
        return;
      }
      if (!tituloDocumento.trim()) {
        showToast("Digite o título do documento", "warning");
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

    if (!uploadChangelog.trim()) {
      showToast("Digite uma descrição das alterações", "warning");
      return;
    }

    setIsUploading(true);
    try {
      let response: Response;

      if (tipoUpload === "ARQUIVO") {
        // Upload de arquivo via FormData
        const formData = new FormData();
        formData.append("arquivo", uploadFile!);
        formData.append("trabalhoId", trabalho.id);
        formData.append("changelog", uploadChangelog);

        response = await fetch("/api/versoes", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Envio de URL via JSON
        response = await fetch("/api/versoes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tipoDocumento: "URL_EXTERNA",
            trabalhoId: trabalho.id,
            urlExterna: urlExterna.trim(),
            plataforma,
            tituloDocumento: tituloDocumento.trim(),
            changelog: uploadChangelog.trim(),
          }),
        });
      }

      if (response.ok) {
        const novaVersao = await response.json();
        showToast("Nova versão enviada com sucesso!", "success");
        resetUploadModal();

        if (onUpdate) {
          onUpdate();
          setTimeout(() => setVersaoExpandida(novaVersao.id), 100);
        }
      } else {
        const error = await response.json();
        let errorMessage = "Erro ao enviar versão";

        if (response.status === 401) {
          errorMessage = "Sessão expirada. Redirecionando para login...";
          showToast(errorMessage, "error");
          // Redirecionar para login após breve delay
          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            window.location.href = "/login";
          }, 1500);
          return;
        } else if (response.status === 403) {
          errorMessage = "Você não tem permissão para enviar versões deste trabalho";
        } else if (response.status === 400) {
          errorMessage = error.error || "Arquivo inválido. Verifique tamanho e formato";
        } else if (error.error) {
          errorMessage = error.error;
        }

        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      let errorMessage = "Erro ao enviar versão";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Botão Voltar */}
      {onBack && (
        <Button variant="secondary" onClick={onBack}>
          ← Voltar
        </Button>
      )}

      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{trabalho.titulo}</CardTitle>
              <p className="text-gray-600 dark:text-gray-400">{trabalho.descricao}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aluno</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {trabalho.aluno.nome}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Orientador</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {trabalho.orientador.nome}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Curso</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{trabalho.curso}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data de Criação</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {trabalho.dataCriacao
                    ? format(new Date(trabalho.dataCriacao), "dd/MM/yyyy", { locale: ptBR })
                    : "Data não disponível"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Badge variant="info">Versão Atual: {trabalho.versaoAtual}</Badge>
            <Badge variant="default">{trabalho.versoes.length} versões</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Versões */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Versões</CardTitle>
            {canUpload && (
              <Button variant="gradient" size="sm" onClick={() => setShowUploadModal(true)}>
                <FileUp className="w-4 h-4 mr-2" />
                Enviar Nova Versão
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trabalho.versoes.map((versao) => {
              const isExpanded = versaoExpandida === versao.id;
              const isLatest = versao.numeroVersao === trabalho.versaoAtual;

              return (
                <div
                  key={versao.id}
                  className={`border rounded-lg ${
                    isLatest
                      ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => toggleVersao(versao.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            isLatest
                              ? "bg-blue-100 dark:bg-blue-900"
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          {versao.urlExterna ? (
                            <LinkIcon
                              className={`w-5 h-5 ${
                                isLatest
                                  ? "text-blue-600 dark:text-blue-300"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            />
                          ) : (
                            <FileUp
                              className={`w-5 h-5 ${
                                isLatest
                                  ? "text-blue-600 dark:text-blue-300"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              Versão {versao.numeroVersao}
                            </h4>
                            {isLatest && <Badge variant="info">Atual</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {versao.nomeArquivo || versao.tituloDocumento || "Documento"} •{" "}
                            {versao.tamanho
                              ? formatFileSize(versao.tamanho)
                              : versao.plataforma
                              ? PLATAFORMAS_OPTIONS.find((p) => p.value === versao.plataforma)
                                  ?.label || versao.plataforma
                              : "URL Externa"}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(versao.dataUpload), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                            {versao.uploadPor && <span>Por {versao.uploadPor.nome}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(
                              versao.id,
                              versao.nomeArquivo || versao.tituloDocumento || "documento",
                              versao.urlExterna
                            );
                          }}
                          disabled={downloadingId === versao.id}
                          title={versao.urlExterna ? "Abrir link externo" : "Baixar arquivo"}
                        >
                          {downloadingId === versao.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                          ) : versao.urlExterna ? (
                            <ExternalLink className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                      {versao.changelog && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                            Alterações
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {versao.changelog}
                          </p>
                        </div>
                      )}

                      {/* Comentários */}
                      {versao.comentarios?.length > 0 && (
                        <div>
                          <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Comentários ({versao.comentarios.length})
                          </h5>
                          <div className="space-y-3">
                            {versao.comentarios.map((comentario: Comentario) => (
                              <div
                                key={comentario.id}
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {comentario.autor.nome}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {format(
                                        new Date(comentario.dataComentario),
                                        "dd/MM/yyyy HH:mm",
                                        { locale: ptBR }
                                      )}
                                    </span>
                                    {/* Botões edit/delete: visivel para o autor ou admin/coordenador */}
                                    {(comentario.autor.id === usuario?.id ||
                                      usuario?.role === "ADMIN" ||
                                      usuario?.role === "COORDENADOR") && (
                                      <div className="flex gap-1">
                                        {comentario.autor.id === usuario?.id && (
                                          <button
                                            onClick={() =>
                                              setComentarioEditando({
                                                id: comentario.id,
                                                texto: comentario.texto,
                                              })
                                            }
                                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Editar comentário"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeletarComentario(comentario.id)}
                                          disabled={deletingComentarioId === comentario.id}
                                          className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                          title="Excluir comentário"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Editar inline */}
                                {comentarioEditando?.id === comentario.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={comentarioEditando.texto}
                                      onChange={(e) =>
                                        setComentarioEditando({
                                          ...comentarioEditando,
                                          texto: e.target.value,
                                        })
                                      }
                                      className="w-full px-3 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                                      rows={3}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={handleEditarComentario}
                                        disabled={isSavingEdit}
                                      >
                                        <Check className="w-3.5 h-3.5 mr-1" />
                                        {isSavingEdit ? "Salvando..." : "Salvar"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setComentarioEditando(null)}
                                        disabled={isSavingEdit}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {comentario.texto}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <textarea
                          placeholder="Adicione um comentário..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                          rows={3}
                          value={novoComentario[versao.id] || ""}
                          onChange={(e) =>
                            setNovoComentario({
                              ...novoComentario,
                              [versao.id]: e.target.value,
                            })
                          }
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddComment(versao.id)}
                          disabled={isAddingComment[versao.id]}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {isAddingComment[versao.id]
                            ? "Adicionando..."
                            : "Adicionar Comentário"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informações da Banca */}
      {trabalho.banca && (
        <Card>
          <CardHeader>
            <CardTitle>Informações da Banca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Data e Horário</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {format(new Date(trabalho.banca.data), "dd/MM/yyyy", { locale: ptBR })} às{" "}
                  {trabalho.banca.horario}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Local</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {trabalho.banca.local}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Membros da Banca</p>
              <div className="space-y-2">
                {trabalho.banca.membros.map((membro) => (
                  <div
                    key={membro.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {membro.usuario.nome}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {membro.papel.charAt(0).toUpperCase() + membro.papel.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avaliação da Banca */}
      {trabalho.banca && (isMembro || podeVerAvaliacoes) && (
        <Card>
          <CardHeader>
            <CardTitle>Avaliação da Banca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Formulário do membro: apenas se banca ativa e ainda não avaliou */}
            {isMembro && bancaAtiva && !jaAvaliou && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Como membro desta banca, registre sua avaliação abaixo.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nota (0 – 10) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={minhaAvaliacao.nota}
                    onChange={(e) => setMinhaAvaliacao({ ...minhaAvaliacao, nota: e.target.value })}
                    className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ex: 8.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Parecer *
                  </label>
                  <textarea
                    rows={5}
                    value={minhaAvaliacao.parecer}
                    onChange={(e) => setMinhaAvaliacao({ ...minhaAvaliacao, parecer: e.target.value })}
                    placeholder="Escreva seu parecer sobre o trabalho..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <Button
                  variant="gradient"
                  onClick={async () => {
                    const nota = parseFloat(minhaAvaliacao.nota);
                    if (isNaN(nota) || nota < 0 || nota > 10) {
                      showToast("Nota deve ser entre 0 e 10", "error");
                      return;
                    }
                    if (!minhaAvaliacao.parecer.trim()) {
                      showToast("Parecer é obrigatório", "error");
                      return;
                    }
                    setIsSubmittingAvaliacao(true);
                    try {
                      const res = await fetch("/api/avaliacoes", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          membroId: meuMembroId,
                          nota,
                          parecer: minhaAvaliacao.parecer.trim(),
                        }),
                      });
                      if (res.ok) {
                        showToast("Avaliação enviada com sucesso!", "success");
                        setJaAvaliou(true);
                        if (onUpdate) onUpdate();
                      } else {
                        const err = await res.json();
                        showToast(err.error || "Erro ao enviar avaliação", "error");
                      }
                    } catch {
                      showToast("Erro de conexão ao enviar avaliação", "error");
                    } finally {
                      setIsSubmittingAvaliacao(false);
                    }
                  }}
                  disabled={isSubmittingAvaliacao}
                  isLoading={isSubmittingAvaliacao}
                >
                  Enviar Avaliação
                </Button>
              </div>
            )}

            {/* Membro já avaliou mas banca ainda não encerrou */}
            {isMembro && bancaAtiva && jaAvaliou && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ Sua avaliação foi registrada. Aguardando os demais membros concluírem.
                </p>
                {minhaAvaliacao.nota && (
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Sua nota: <strong>{parseFloat(minhaAvaliacao.nota).toFixed(1)}</strong>
                  </p>
                )}
              </div>
            )}

            {/* Listagem de todas as avaliações após banca realizada */}
            {podeVerAvaliacoes && avaliacoes.length > 0 && (
              <div className="space-y-4">
                {isMembro && <hr className="border-gray-200 dark:border-gray-700" />}
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Avaliações da Banca
                </p>
                {avaliacoes.map((av) => (
                  <div
                    key={av.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {av.membro.titulacao && `${av.membro.titulacao} `}{av.membro.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {av.membro.papel.charAt(0) + av.membro.papel.slice(1).toLowerCase()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="success">Nota: {av.nota.toFixed(1)}</Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {format(new Date(av.dataAvaliacao), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {av.parecer}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Sem avaliações ainda */}
            {podeVerAvaliacoes && bancaRealizada && avaliacoes.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhuma avaliação registrada ainda.
              </p>
            )}

          </CardContent>
        </Card>
      )}

      {/* Modal de Upload de Nova Versão */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Enviar Nova Versão
              </h3>
              <button
                onClick={handleCloseUploadModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Seletor de tipo: Arquivo ou URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Envio
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoUpload"
                      value="ARQUIVO"
                      checked={tipoUpload === "ARQUIVO"}
                      onChange={() => setTipoUpload("ARQUIVO")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <FileUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Arquivo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tipoUpload"
                      value="URL_EXTERNA"
                      checked={tipoUpload === "URL_EXTERNA"}
                      onChange={() => setTipoUpload("URL_EXTERNA")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Link Externo
                    </span>
                  </label>
                </div>
              </div>

              {/* Campos para ARQUIVO */}
              {tipoUpload === "ARQUIVO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Arquivo *
                  </label>
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

                        const ext = file.name.split(".").pop()?.toLowerCase();
                        const allowedExt = FILE_CONFIG.ALLOWED_EXTENSIONS.map((e) =>
                          e.replace(".", "")
                        );
                        if (!ext || !allowedExt.includes(ext)) {
                          showToast(FILE_CONFIG.ERRORS.INVALID_TYPE, "error");
                          e.target.value = "";
                          return;
                        }

                        setUploadFile(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
                  />
                  {uploadFile && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Formatos aceitos: PDF, DOC, DOCX (máx. {FILE_CONFIG.MAX_SIZE_MB}MB)
                  </p>
                </div>
              )}

              {/* Campos para URL_EXTERNA */}
              {tipoUpload === "URL_EXTERNA" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      URL do Documento *
                    </label>
                    <input
                      type="url"
                      value={urlExterna}
                      onChange={(e) => setUrlExterna(e.target.value)}
                      placeholder="https://docs.google.com/document/d/..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
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
                      placeholder="Ex: TCC - Versão Final"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição das Alterações *
                </label>
                <textarea
                  value={uploadChangelog}
                  onChange={(e) => setUploadChangelog(e.target.value)}
                  rows={3}
                  placeholder="Descreva as mudanças nesta versão..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={handleCloseUploadModal}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleUploadNewVersion}
                isLoading={isUploading}
                disabled={
                  (tipoUpload === "ARQUIVO" && !uploadFile) ||
                  (tipoUpload === "URL_EXTERNA" &&
                    (!urlExterna.trim() || !tituloDocumento.trim())) ||
                  !uploadChangelog.trim()
                }
              >
                {tipoUpload === "ARQUIVO" ? (
                  <FileUp className="w-4 h-4 mr-2" />
                ) : (
                  <LinkIcon className="w-4 h-4 mr-2" />
                )}
                {tipoUpload === "ARQUIVO" ? "Enviar Arquivo" : "Salvar Link"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
