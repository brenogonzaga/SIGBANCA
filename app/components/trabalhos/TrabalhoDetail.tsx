"use client";

import React, { useState } from "react";
import { Trabalho } from "@/app/types";
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
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadChangelog, setUploadChangelog] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCloseUploadModal = () => {
    const hasData = uploadFile !== null || uploadChangelog.trim() !== "";

    if (hasData) {
      if (window.confirm("Você tem dados não salvos. Deseja realmente fechar?")) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadChangelog("");
      }
    } else {
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadChangelog("");
    }
  };

  const canUpload =
    usuario?.role === "ADMIN" ||
    usuario?.role === "COORDENADOR" ||
    trabalho.aluno.id === usuario?.id ||
    trabalho.orientador.id === usuario?.id;

  const toggleVersao = (versaoId: string) => {
    setVersaoExpandida(versaoExpandida === versaoId ? null : versaoId);
  };

  const handleDownload = async (versaoId: string, nomeArquivo: string) => {
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

  const handleUploadNewVersion = async () => {
    if (!uploadFile) {
      showToast("Selecione um arquivo", "warning");
      return;
    }

    if (!uploadChangelog.trim()) {
      showToast("Digite uma descrição das alterações", "warning");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", uploadFile);
      formData.append("trabalhoId", trabalho.id);
      formData.append("changelog", uploadChangelog);

      const response = await fetch("/api/versoes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const novaVersao = await response.json();
        showToast("Nova versão enviada com sucesso!", "success");
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadChangelog("");

        if (onUpdate) {
          onUpdate();
          setTimeout(() => setVersaoExpandida(novaVersao.id), 100);
        }
      } else {
        const error = await response.json();
        let errorMessage = "Erro ao enviar versão";

        if (response.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente";
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
                    ? trabalho.dataCriacao.toDateString()
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
                          <FileUp
                            className={`w-5 h-5 ${
                              isLatest
                                ? "text-blue-600 dark:text-blue-300"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              Versão {versao.numeroVersao}
                            </h4>
                            {isLatest && <Badge variant="info">Atual</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {versao.nomeArquivo} • {formatFileSize(versao.tamanho)}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(versao.dataUpload, "dd/MM/yyyy 'às' HH:mm", {
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
                            handleDownload(versao.id, versao.nomeArquivo);
                          }}
                          disabled={downloadingId === versao.id}
                        >
                          {downloadingId === versao.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
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
                            {versao.comentarios.map((comentario) => (
                              <div
                                key={comentario.id}
                                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {comentario.autor.nome}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(comentario.dataComentario, "dd/MM/yyyy HH:mm", {
                                      locale: ptBR,
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {comentario.texto}
                                </p>
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
                  {format(trabalho.banca.data, "dd/MM/yyyy", { locale: ptBR })} às{" "}
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
                disabled={!uploadFile || !uploadChangelog.trim()}
              >
                <FileUp className="w-4 h-4 mr-2" />
                Enviar Versão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
