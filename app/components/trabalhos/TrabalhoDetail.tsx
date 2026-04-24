"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Trabalho, PlataformaExterna, TipoDocumento, Comentario } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { FILE_CONFIG, VALIDATION_MESSAGES } from "@/app/config";
import { RevisionTimeline } from "./RevisionTimeline";
import {
  FileText,
  User,
  Calendar,
  Download,
  MessageSquare,
  ChevronDown,
  Clock,
  FileUp,
  X,
  Link as LinkIcon,
  ExternalLink,
  Edit,
  Trash2,
  Check,
  ArrowLeft,
  Users,
  Mail,
  CheckCircle,
  TrendingUp,
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
  const router = useRouter();
  const [versaoExpandida, setVersaoExpandida] = useState<string | null>(
    trabalho.versoes[trabalho.versoes.length - 1]?.id || null,
  );
  const [novoComentario, setNovoComentario] = useState<{ [key: string]: string }>({});
  const [isAddingComment, setIsAddingComment] = useState<{ [key: string]: boolean }>({});
  // Estado de edição de comentários
  const [comentarioEditando, setComentarioEditando] = useState<{
    id: string;
    texto: string;
  } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingComentarioId, setDeletingComentarioId] = useState<string | null>(null);
  // Estado de avaliação
  const [minhaAvaliacao, setMinhaAvaliacao] = useState<{ nota: string; parecer: string }>({
    nota: "",
    parecer: "",
  });
  const [avaliacoes, setAvalocoes] = useState<
    Array<{
      id: string;
      membro: { id: string; nome: string; titulacao?: string; papel: string };
      nota: number;
      parecer: string;
      dataAvaliacao: string;
    }>
  >([]);
  const [isSubmittingAvaliacao, setIsSubmittingAvaliacao] = useState(false);
  const [jaAvaliou, setJaAvaliou] = useState(false);

  const meuMembroId = trabalho.banca?.membros.find((m) => m.usuario.id === usuario?.id)?.id;
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
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setAvalocoes(data.avaliacoes || []);
        if (isMembro) {
          const jaFez = data.avaliacoes?.some(
            (a: { membro: { id: string } }) => a.membro.id === usuario?.id,
          );
          setJaAvaliou(!!jaFez);

          // Preencher campos com avaliação existente se membro já avaliou
          const minhaAv = data.avaliacoes?.find(
            (a: { membro: { id: string }; nota: number; parecer: string }) =>
              a.membro.id === usuario?.id,
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
  const [showTimeline, setShowTimeline] = useState(true);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

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
    urlExternaVersao?: string,
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

  // Função para mudar status do trabalho
  const handleChangeStatus = async (novoStatus: string) => {
    if (!window.confirm(`Deseja alterar o status do trabalho para ${novoStatus}?`)) {
      return;
    }

    setIsChangingStatus(true);
    try {
      const response = await fetch(`/api/trabalhos/${trabalho.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        showToast("Status alterado com sucesso!", "success");
        if (onUpdate) {
          onUpdate();
        }
      } else {
        const error = await response.json();
        showToast(error.error || "Erro ao alterar status", "error");
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      showToast("Erro de conexão ao alterar status", "error");
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Define ações disponíveis baseadas no status atual e role do usuário
  const getAvailableActions = () => {
    const actions: Array<{
      label: string;
      status: string;
      variant: "gradient" | "outline" | "danger";
    }> = [];

    if (!usuario) return actions;

    const isOrientador = trabalho.orientador.id === usuario.id;
    const isAluno = trabalho.aluno.id === usuario.id;
    const isAdmin = usuario.role === "ADMIN" || usuario.role === "COORDENADOR";
    const hasBanca =
      !!trabalho.banca && trabalho.banca.membros && trabalho.banca.membros.length > 0;

    switch (trabalho.status) {
      case "EM_ELABORACAO":
        if (isAluno || isAdmin) {
          actions.push({
            label: "Submeter para Revisão",
            status: "SUBMETIDO",
            variant: "gradient",
          });
        }
        if (isAluno || isAdmin) {
          actions.push({ label: "Cancelar Trabalho", status: "CANCELADO", variant: "danger" });
        }
        break;

      case "SUBMETIDO":
        if (isOrientador || isAdmin) {
          actions.push({
            label: "Aprovar",
            status: "APROVADO_ORIENTADOR",
            variant: "gradient",
          });
          actions.push({
            label: "Solicitar Revisão",
            status: "EM_REVISAO",
            variant: "outline",
          });
        }
        if (isAluno || isAdmin) {
          actions.push({ label: "Cancelar", status: "CANCELADO", variant: "danger" });
        }
        break;

      case "EM_REVISAO":
        if (isAluno) {
          actions.push({
            label: "Reenviar para Análise",
            status: "SUBMETIDO",
            variant: "gradient",
          });
        }
        if (isOrientador || isAdmin) {
          actions.push({
            label: "Aprovar",
            status: "APROVADO_ORIENTADOR",
            variant: "gradient",
          });
        }
        if (isAluno || isAdmin) {
          actions.push({ label: "Cancelar", status: "CANCELADO", variant: "danger" });
        }
        break;

      case "APROVADO_ORIENTADOR":
        if (isOrientador || isAdmin) {
          actions.push({
            label: "Encaminhar para Banca",
            status: "AGUARDANDO_BANCA",
            variant: "gradient",
          });
        }
        if (isAdmin) {
          actions.push({ label: "Cancelar", status: "CANCELADO", variant: "danger" });
        }
        break;

      case "AGUARDANDO_BANCA":
        if ((isOrientador || isAdmin) && hasBanca) {
          actions.push({
            label: "Confirmar Agendamento",
            status: "BANCA_AGENDADA",
            variant: "gradient",
          });
        }
        if (isAdmin) {
          actions.push({ label: "Reagendar", status: "AGUARDANDO_BANCA", variant: "outline" });
          actions.push({ label: "Cancelar", status: "CANCELADO", variant: "danger" });
        }
        break;

      case "BANCA_AGENDADA":
        // Não permitir mudar status manualmente - o sistema calculará automaticamente
        // após todas as avaliações serem enviadas (média >= 6 = APROVADO, < 6 = REPROVADO)
        if (isAdmin || isOrientador) {
          actions.push({ label: "Reagendar", status: "AGUARDANDO_BANCA", variant: "outline" });
        }
        if (isAdmin) {
          actions.push({ label: "Cancelar", status: "CANCELADO", variant: "danger" });
        }
        break;

      case "REPROVADO":
        if (isAdmin) {
          actions.push({ label: "Permitir Revisão", status: "EM_REVISAO", variant: "outline" });
          actions.push({ label: "Reiniciar", status: "EM_ELABORACAO", variant: "outline" });
        }
        break;
    }

    return actions;
  };

  const availableActions = getAvailableActions();
  const hasBanca =
    !!trabalho.banca && trabalho.banca.membros && trabalho.banca.membros.length > 0;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Botão Voltar */}
      {onBack && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[var(--muted)] hover:text-[var(--primary)] transition-all -ml-2 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para listagem
        </Button>
      )}

      {/* Hero Section / Informações Gerais */}
      <Card className="surface-card overflow-hidden border-t-4 border-t-[var(--primary)] relative group">
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.05] pointer-events-none group-hover:opacity-[0.1] transition-opacity"></div>
        <CardHeader className="p-8 pb-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="info"
                  className="bg-[var(--primary-light)]/10 text-[var(--primary)] ring-1 ring-[var(--primary-light)] px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                >
                  {trabalho.curso}
                </Badge>
                <Badge
                  variant="default"
                  className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[var(--surface-light)] border border-[var(--border)]"
                >
                  {trabalho.status}
                </Badge>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans] leading-tight group-hover:text-[var(--primary)] transition-colors">
                {trabalho.titulo}
              </h2>
              <p className="text-[var(--muted)] text-lg leading-relaxed max-w-3xl">
                {trabalho.descricao}
              </p>
            </div>
            <div className="flex flex-col gap-2 min-w-[200px] animate-fade-in">
              <div className="p-6 rounded-[24px] bg-[var(--surface-light)]/50 backdrop-blur-sm border border-[var(--border)] text-center shadow-inner group-hover:shadow-md transition-all">
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-2">
                  Versão Atual
                </p>
                <p className="text-4xl font-black text-[var(--primary)] tracking-tighter">
                  {trabalho.versaoAtual}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-[var(--border-light)]">
            <div className="flex items-center gap-4 group/item">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)]/50 flex items-center justify-center shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <User className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                  Aluno
                </p>
                <p className="font-bold text-[var(--foreground)] text-sm">
                  {trabalho.aluno.nome}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 group/item">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)]/50 flex items-center justify-center shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <User className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                  Orientador
                </p>
                <p className="font-bold text-[var(--foreground)] text-sm">
                  {trabalho.orientador.nome}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 group/item">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <FileText className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                  Histórico
                </p>
                <p className="font-bold text-[var(--foreground)] text-sm">
                  {trabalho.versoes.length} submissões
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 group/item">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shadow-inner group-hover/item:scale-110 transition-transform duration-500">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                  Submetido em
                </p>
                <p className="font-bold text-[var(--foreground)] text-sm">
                  {trabalho.dataCriacao
                    ? format(new Date(trabalho.dataCriacao), "dd MMM, yyyy", { locale: ptBR })
                    : "Em breve"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações de Status - Mostrar se houver ações disponíveis */}
      {availableActions.length > 0 && (
        <Card className="surface-card overflow-hidden border-l-4 border-l-[var(--primary)]">
          <CardHeader className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="text-lg font-black text-[var(--foreground)]">Ações Disponíveis</h3>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-wrap gap-3">
              {availableActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  onClick={() => handleChangeStatus(action.status)}
                  disabled={isChangingStatus}
                  className="rounded-xl"
                >
                  {isChangingStatus ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : null}
                  {action.label}
                </Button>
              ))}
              {/* Botão de cadastrar banca quando status é AGUARDANDO_BANCA e sem banca criada */}
              {trabalho.status === "AGUARDANDO_BANCA" &&
                !hasBanca &&
                (usuario?.id === trabalho.orientador.id ||
                  usuario?.role === "ADMIN" ||
                  usuario?.role === "COORDENADOR") && (
                  <Button
                    variant="gradient"
                    className="rounded-xl"
                    onClick={() => router.push(`/bancas/cadastrar?trabalhoId=${trabalho.id}`)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Cadastrar Banca
                  </Button>
                )}
            </div>
            <p className="text-xs text-[var(--muted)] mt-4 font-medium">
              Status atual:{" "}
              <span className="font-bold text-[var(--foreground)]">{trabalho.status}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline de Evolução - Premium Highlight */}
      <Card className="surface-card overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] opacity-50"></div>
        <CardHeader className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">
                  Timeline de Evolução
                </h3>
                <p className="text-[var(--muted)] text-sm font-medium">
                  Fluxo cronológico do trabalho acadêmico
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="px-4 py-2 bg-[var(--surface-light)] hover:bg-[var(--primary-light)]/20 text-[var(--muted)] hover:text-[var(--primary)] rounded-xl border border-[var(--border-light)] text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {showTimeline ? "Recolher" : "Visualizar Detalhes"}
            </button>
          </div>
        </CardHeader>
        {showTimeline && (
          <CardContent className="p-8 pt-0 animate-fade-in">
            <RevisionTimeline trabalho={trabalho} versoes={trabalho.versoes} />
          </CardContent>
        )}
      </Card>

      {/* Histórico de Versões */}
      <Card className="surface-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32"></div>
        <CardHeader className="p-8 pb-4 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-8 bg-[var(--primary)] rounded-full"></div>
              <h3 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">
                Timeline de Versões
              </h3>
            </div>
            {canUpload && (
              <Button
                variant="gradient"
                size="lg"
                onClick={() => setShowUploadModal(true)}
                className="px-8 rounded-2xl shadow-xl shadow-indigo-500/20 animate-scale-in"
              >
                <FileUp className="w-5 h-5 mr-3" />
                Submeter Versão
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-4 relative z-10">
          <div className="space-y-6">
            {trabalho.versoes.map((versao) => {
              const isExpanded = versaoExpandida === versao.id;
              const isLatest = versao.numeroVersao === trabalho.versaoAtual;

              return (
                <div
                  key={versao.id}
                  className={`group relative overflow-hidden transition-all duration-500 rounded-[32px] border ${
                    isExpanded
                      ? "ring-2 ring-[var(--primary-light)] border-transparent shadow-2xl bg-[var(--surface-light)]"
                      : isLatest
                        ? "border-[var(--primary-light)] bg-[var(--primary-light)]/5 hover:bg-[var(--primary-light)]/10"
                        : "border-[var(--border)] bg-[var(--surface-light)]/50 hover:bg-[var(--surface-light)]"
                  }`}
                >
                  <div className="p-6 cursor-pointer" onClick={() => toggleVersao(versao.id)}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-5 flex-1">
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 ${
                            isLatest
                              ? "bg-[var(--primary)] text-white shadow-lg shadow-indigo-500/20"
                              : "bg-[var(--background)] border border-[var(--border-light)] text-[var(--muted)]"
                          }`}
                        >
                          {versao.urlExterna ? (
                            <LinkIcon className="w-6 h-6" />
                          ) : (
                            <FileUp className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em]">
                              Versão {versao.numeroVersao}
                            </span>
                            {isLatest && (
                              <Badge
                                variant="info"
                                className="text-[9px] font-black py-0.5 px-2"
                              >
                                RECENTE
                              </Badge>
                            )}
                          </div>
                          <h4 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                            {versao.nomeArquivo ||
                              versao.tituloDocumento ||
                              "Documento sem título"}
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs font-medium text-[var(--muted)]">
                            <span className="flex items-center gap-2 bg-[var(--background)]/50 px-3 py-1 rounded-full border border-[var(--border-light)]">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(versao.dataUpload), "dd MMM, yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                            <span className="flex items-center gap-2 bg-[var(--background)]/50 px-3 py-1 rounded-full border border-[var(--border-light)]">
                              <User className="w-3.5 h-3.5" />
                              {versao.uploadPor?.nome || "Sistema"}
                            </span>
                            {versao.tamanho ? (
                              <span className="bg-[var(--primary-light)]/10 text-[var(--primary)] px-2 py-0.5 rounded-lg font-black text-[10px]">
                                {formatFileSize(versao.tamanho)}
                              </span>
                            ) : (
                              versao.plataforma && (
                                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-lg font-black text-[10px] uppercase">
                                  {PLATAFORMAS_OPTIONS.find(
                                    (p) => p.value === versao.plataforma,
                                  )?.label || versao.plataforma}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          size="md"
                          variant="outline"
                          className="rounded-xl border-[var(--border)] hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(
                              versao.id,
                              versao.nomeArquivo || versao.tituloDocumento || "documento",
                              versao.urlExterna,
                            );
                          }}
                          disabled={downloadingId === versao.id}
                        >
                          {downloadingId === versao.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : versao.urlExterna ? (
                            <ExternalLink className="w-4 h-4" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                        <div
                          className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? "bg-[var(--primary-light)] text-[var(--primary)] rotate-180" : "bg-[var(--background)] text-[var(--muted)]"}`}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-[var(--border-light)] p-8 bg-[var(--background)]/30 backdrop-blur-xl animate-fade-in space-y-8">
                      {versao.changelog && (
                        <div className="bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] relative overflow-hidden group/change">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--primary)] opacity-50"></div>
                          <h5 className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FileText className="w-3 h-3" /> Notas de Revisão
                          </h5>
                          <p className="text-sm text-[var(--foreground)] leading-relaxed font-semibold italic">
                            "{versao.changelog}"
                          </p>
                        </div>
                      )}

                      {/* Comentários Section */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xl font-black text-[var(--foreground)] tracking-tight flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-[var(--primary)]" />
                            Anotações Acadêmicas
                            {versao.comentarios?.length > 0 && (
                              <Badge
                                variant="default"
                                className="ml-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
                              >
                                {versao.comentarios.length}
                              </Badge>
                            )}
                          </h5>
                        </div>

                        {versao.comentarios?.length > 0 ? (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {versao.comentarios.map((comentario: Comentario) => (
                              <div
                                key={comentario.id}
                                className={`flex flex-col p-6 rounded-[24px] border transition-all duration-300 ${
                                  comentario.autor.id === usuario?.id
                                    ? "bg-white dark:bg-[var(--surface)] border-[var(--border)] shadow-sm self-end max-w-[90%] ml-auto"
                                    : "bg-[var(--surface-light)]/40 border-[var(--border-light)] max-w-[90%]"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] flex items-center justify-center text-white text-[10px] font-bold shadow-md">
                                      {comentario.autor.nome.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-bold text-xs text-[var(--foreground)]">
                                        {comentario.autor.nome}
                                      </p>
                                      <p className="text-[10px] text-[var(--muted-light)] font-bold uppercase tracking-tighter">
                                        {format(
                                          new Date(comentario.dataComentario),
                                          "dd MMM, HH:mm",
                                          { locale: ptBR },
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  {(comentario.autor.id === usuario?.id ||
                                    usuario?.role === "ADMIN" ||
                                    usuario?.role === "COORDENADOR") && (
                                    <div className="flex gap-2">
                                      {comentario.autor.id === usuario?.id && (
                                        <button
                                          onClick={() =>
                                            setComentarioEditando({
                                              id: comentario.id,
                                              texto: comentario.texto,
                                            })
                                          }
                                          className="p-1.5 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)]/20 rounded-lg transition-all"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleDeletarComentario(comentario.id)}
                                        disabled={deletingComentarioId === comentario.id}
                                        className="p-1.5 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {comentarioEditando?.id === comentario.id ? (
                                  <div className="space-y-3">
                                    <textarea
                                      value={comentarioEditando.texto}
                                      onChange={(e) =>
                                        setComentarioEditando({
                                          ...comentarioEditando,
                                          texto: e.target.value,
                                        })
                                      }
                                      className="w-full p-4 bg-[var(--background)] border border-[var(--primary-light)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 text-sm font-medium resize-none"
                                      rows={3}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setComentarioEditando(null)}
                                        disabled={isSavingEdit}
                                        className="rounded-xl"
                                      >
                                        Cancelar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="gradient"
                                        onClick={handleEditarComentario}
                                        disabled={isSavingEdit}
                                        className="rounded-xl"
                                      >
                                        {isSavingEdit ? "Salvando..." : "Salvar Alteração"}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-[var(--foreground)] leading-relaxed font-medium">
                                    {comentario.texto}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-[var(--surface-light)]/20 rounded-2xl border border-dashed border-[var(--border)]">
                            <MessageSquare className="w-10 h-10 text-[var(--muted-light)] mx-auto mb-3 opacity-20" />
                            <p className="text-sm text-[var(--muted)] font-medium">
                              Nenhum comentário acadêmico ainda.
                            </p>
                          </div>
                        )}

                        {/* Novo Comentário Input */}
                        <div className="pt-6 border-t border-[var(--border-light)]">
                          <div className="relative group/input">
                            <textarea
                              placeholder="Escreva sua análise técnica ou dúvida..."
                              className="w-full p-5 pr-32 bg-[var(--surface)] border border-[var(--border)] rounded-[24px] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] text-sm font-medium shadow-sm group-hover/input:shadow-md transition-all resize-none min-h-[100px]"
                              value={novoComentario[versao.id] || ""}
                              onChange={(e) =>
                                setNovoComentario({
                                  ...novoComentario,
                                  [versao.id]: e.target.value,
                                })
                              }
                            />
                            <div className="absolute right-3 bottom-3">
                              <Button
                                size="md"
                                variant="gradient"
                                onClick={() => handleAddComment(versao.id)}
                                disabled={
                                  isAddingComment[versao.id] ||
                                  !novoComentario[versao.id]?.trim()
                                }
                                className="rounded-2xl shadow-lg shadow-indigo-500/10 px-6 py-5"
                              >
                                {isAddingComment[versao.id] ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Enviar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Defesa */}
      {trabalho.banca && (
        <Card className="surface-card overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-50"></div>
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">
                  Detalhes da Defesa
                </h3>
                <p className="text-[var(--muted)] text-sm font-medium">
                  Informações logísticas e membros avaliadores
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[var(--surface-light)]/50 p-6 rounded-[32px] border border-[var(--border)]">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[var(--surface)] shadow-sm flex items-center justify-center border border-[var(--border-light)]">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">
                    Agendamento
                  </p>
                  <p className="font-bold text-[var(--foreground)] text-lg">
                    {format(new Date(trabalho.banca.data), "dd 'de' MMMM, yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-sm font-medium text-[var(--muted)] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> às {trabalho.banca.horario}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[var(--surface)] shadow-sm flex items-center justify-center border border-[var(--border-light)]">
                  <ExternalLink className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">
                    Local / Link
                  </p>
                  <p className="font-bold text-[var(--foreground)] text-lg truncate max-w-[250px]">
                    {trabalho.banca.local}
                  </p>
                  <Badge
                    variant="info"
                    className="text-[9px] font-black uppercase tracking-widest mt-1 bg-[var(--primary-light)]/20 text-[var(--primary)]"
                  >
                    Oficial
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-6">
                <h4 className="text-sm font-black text-[var(--muted)] uppercase tracking-[0.2em]">
                  Composição da Banca
                </h4>
                <div className="flex-1 h-px bg-[var(--border-light)]"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {trabalho.banca.membros.map((membro) => (
                  <div
                    key={membro.id}
                    className="flex flex-col p-6 bg-[var(--surface)] dark:bg-[var(--surface-light)] rounded-[28px] border border-[var(--border)] hover:border-[var(--primary-light)] hover:shadow-lg transition-all group/membro"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary)]/10 rounded-2xl flex items-center justify-center group-hover/membro:scale-110 transition-transform duration-500">
                        <User className="w-7 h-7 text-[var(--primary)]" />
                      </div>
                      <div>
                        <p className="font-black text-[var(--foreground)] text-base group-hover/membro:text-[var(--primary)] transition-colors line-clamp-1">
                          {membro.usuario.nome}
                        </p>
                        <Badge
                          variant="info"
                          className="text-[8px] font-black py-0 px-2 uppercase tracking-tighter"
                        >
                          {membro.papel}
                        </Badge>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-[var(--border-light)] mt-auto">
                      <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-tight flex items-center gap-2">
                        <Mail className="w-3 h-3" /> {membro.usuario.email}
                      </p>
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
                    onChange={(e) =>
                      setMinhaAvaliacao({ ...minhaAvaliacao, nota: e.target.value })
                    }
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
                    onChange={(e) =>
                      setMinhaAvaliacao({ ...minhaAvaliacao, parecer: e.target.value })
                    }
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
                    if (minhaAvaliacao.parecer.trim().length < 20) {
                      showToast("Parecer deve ter no mínimo 20 caracteres", "error");
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
                          {av.membro.titulacao && `${av.membro.titulacao} `}
                          {av.membro.nome}
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
        <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] max-w-xl w-full p-10 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED]"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--primary)]/10 transition-colors"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)]/10 flex items-center justify-center text-[var(--primary)]">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                    Nova Submissão
                  </h3>
                  <p className="text-sm text-[var(--muted)] font-medium">
                    Versão {trabalho.versaoAtual + 1} para {trabalho.titulo}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseUploadModal}
                className="p-3 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-light)] rounded-2xl transition-all"
                disabled={isUploading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8 relative z-10">
              {/* Seletor de tipo: Bento-style */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoUpload("ARQUIVO")}
                  className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all duration-500 gap-3 ${
                    tipoUpload === "ARQUIVO"
                      ? "border-[var(--primary)] bg-[var(--primary-light)]/5 text-[var(--primary)] shadow-lg shadow-indigo-500/10"
                      : "border-[var(--border)] bg-[var(--surface-light)]/50 text-[var(--muted)] hover:border-[var(--primary-light)] hover:bg-[var(--surface-light)]"
                  }`}
                >
                  <FileText
                    className={`w-8 h-8 ${tipoUpload === "ARQUIVO" ? "scale-110" : ""} transition-transform`}
                  />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Arquivo Local
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoUpload("URL_EXTERNA")}
                  className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 transition-all duration-500 gap-3 ${
                    tipoUpload === "URL_EXTERNA"
                      ? "border-[var(--primary)] bg-[var(--primary-light)]/5 text-[var(--primary)] shadow-lg shadow-indigo-500/10"
                      : "border-[var(--border)] bg-[var(--surface-light)]/50 text-[var(--muted)] hover:border-[var(--primary-light)] hover:bg-[var(--surface-light)]"
                  }`}
                >
                  <LinkIcon
                    className={`w-8 h-8 ${tipoUpload === "URL_EXTERNA" ? "scale-110" : ""} transition-transform`}
                  />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Link Externo
                  </span>
                </button>
              </div>

              {/* Campos para ARQUIVO */}
              {tipoUpload === "ARQUIVO" && (
                <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-500">
                  <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest block px-1">
                    Upload do Documento
                  </label>
                  <div className="relative group/file">
                    <input
                      type="file"
                      id="file-upload"
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
                            e.replace(".", ""),
                          );
                          if (!ext || !allowedExt.includes(ext)) {
                            showToast(FILE_CONFIG.ERRORS.INVALID_TYPE, "error");
                            e.target.value = "";
                            return;
                          }
                          setUploadFile(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full p-8 border border-dashed border-[var(--primary-light)] bg-[var(--primary-light)]/5 rounded-[32px] cursor-pointer hover:bg-[var(--primary-light)]/10 hover:border-[var(--primary)] transition-all group/label"
                    >
                      {uploadFile ? (
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-lg">
                            <Check className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[var(--foreground)] truncate max-w-[200px]">
                              {uploadFile.name}
                            </p>
                            <p className="text-[10px] text-[var(--muted)]">
                              {(uploadFile.size / 1024 / 1024).toFixed(2)} MB • PDF/Word
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Download className="w-10 h-10 text-[var(--primary-light)] mb-3 group-hover/label:scale-110 transition-transform" />
                          <p className="text-sm font-bold text-[var(--foreground)]">
                            Clique para selecionar
                          </p>
                          <p className="text-xs text-[var(--muted)] mt-1">
                            PDF, DOC, DOCX até {FILE_CONFIG.MAX_SIZE_MB}MB
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              )}

              {/* Campos para URL_EXTERNA */}
              {tipoUpload === "URL_EXTERNA" && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest block px-1">
                      Link do Documento
                    </label>
                    <input
                      type="url"
                      value={urlExterna}
                      onChange={(e) => setUrlExterna(e.target.value)}
                      placeholder="https://docs.google.com/document/..."
                      className="w-full p-5 bg-[var(--background)] border border-[var(--border)] rounded-[24px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] text-sm font-medium transition-all shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest block px-1">
                        Plataforma
                      </label>
                      <select
                        value={plataforma}
                        onChange={(e) => setPlataforma(e.target.value as PlataformaExterna)}
                        className="w-full p-5 bg-[var(--background)] border border-[var(--border)] rounded-[24px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] text-sm font-bold transition-all shadow-inner appearance-none"
                      >
                        {PLATAFORMAS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest block px-1">
                        Título Amigável
                      </label>
                      <input
                        type="text"
                        value={tituloDocumento}
                        onChange={(e) => setTituloDocumento(e.target.value)}
                        placeholder="Ex: TCC v2 - Revisitado"
                        className="w-full p-5 bg-[var(--background)] border border-[var(--border)] rounded-[24px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] text-sm font-medium transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest block px-1">
                  Notas da Versão (Changelog)
                </label>
                <textarea
                  value={uploadChangelog}
                  onChange={(e) => setUploadChangelog(e.target.value)}
                  rows={3}
                  placeholder="Quais foram as principais evoluções nesta submissão?"
                  className="w-full p-5 bg-[var(--background)] border border-[var(--border)] rounded-[32px] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] text-sm font-medium transition-all shadow-inner resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 items-center justify-end relative z-10 pt-4">
              <Button
                variant="ghost"
                size="lg"
                onClick={handleCloseUploadModal}
                disabled={isUploading}
                className="rounded-2xl px-8"
              >
                Descartar
              </Button>
              <Button
                variant="gradient"
                size="lg"
                onClick={handleUploadNewVersion}
                isLoading={isUploading}
                disabled={
                  isUploading ||
                  (tipoUpload === "ARQUIVO" && !uploadFile) ||
                  (tipoUpload === "URL_EXTERNA" &&
                    (!urlExterna.trim() || !tituloDocumento.trim())) ||
                  !uploadChangelog.trim()
                }
                className="rounded-2xl px-12 shadow-2xl shadow-indigo-500/20 text-lg font-black"
              >
                {tipoUpload === "ARQUIVO" ? "Publicar Arquivo" : "Salvar Link"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
