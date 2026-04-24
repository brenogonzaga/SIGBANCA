"use client";

import React, { useState, useEffect } from "react";
import { TrabalhoListItem } from "@/app/types/custom";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  FileText,
  User,
  Calendar,
  Eye,
  Plus,
  Edit,
  Trash2,
  Award,
  CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { ConfirmModal } from "../ui/Modal";
import Link from "next/link";

interface TrabalhoListProps {
  onSelectTrabalho?: (trabalho: TrabalhoListItem) => void;
}

export function TrabalhoList({ onSelectTrabalho }: TrabalhoListProps) {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const [trabalhos, setTrabalhos] = useState<TrabalhoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [trabalhoToDelete, setTrabalhoToDelete] = useState<{
    id: string;
    titulo: string;
  } | null>(null);

  const canCreate =
    usuario?.role === "ALUNO" || usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN";

  const canEdit = (trabalho: TrabalhoListItem) => {
    if (usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR") return true;
    return trabalho.aluno.id === usuario?.id || trabalho.orientador.id === usuario?.id;
  };

  const canDelete = (_trabalho: TrabalhoListItem) => {
    if (usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR") return true;
    return false;
  };

  // Professor pode agendar banca a qualquer momento (exceto trabalhos já concluídos/cancelados)
  const FINAL_STATUSES = ["APROVADO", "REPROVADO", "CANCELADO", "BANCA_AGENDADA"];
  const canSchedule = (trabalho: TrabalhoListItem) => {
    if (FINAL_STATUSES.includes(trabalho.status)) return false;
    if (usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR") return true;
    return trabalho.orientador.id === usuario?.id;
  };

  const handleDelete = async () => {
    if (!trabalhoToDelete) return;

    setDeletingId(trabalhoToDelete.id);
    try {
      const response = await fetch(`/api/trabalhos/${trabalhoToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = "Erro ao excluir trabalho";

        if (response.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente";
        } else if (response.status === 403) {
          errorMessage = "Você não tem permissão para excluir este trabalho";
        } else if (response.status === 404) {
          errorMessage = "Trabalho não encontrado";
        } else if (error.error) {
          errorMessage = error.error;
        }

        throw new Error(errorMessage);
      }

      showToast("Trabalho excluído com sucesso!", "success");
      setTrabalhos(trabalhos.filter((t) => t.id !== trabalhoToDelete.id));
      setTrabalhoToDelete(null);
    } catch (error) {
      let errorMessage = "Erro ao excluir trabalho";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && String(error).includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet";
      }

      showToast(errorMessage, "error");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    async function fetchTrabalhos() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/trabalhos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTrabalhos(data);
        }
      } catch (error) {
        console.error("Erro ao carregar trabalhos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrabalhos();
  }, [token]);

  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }
  > = {
    EM_ELABORACAO: { label: "Em Elaboração", variant: "warning" },
    SUBMETIDO: { label: "Submetido", variant: "info" },
    EM_REVISAO: { label: "Em Revisão", variant: "default" },
    APROVADO_ORIENTADOR: { label: "Aprovado pelo Orientador", variant: "success" },
    AGUARDANDO_BANCA: { label: "Aguardando Banca", variant: "info" },
    BANCA_AGENDADA: { label: "Banca Agendada", variant: "info" },
    APROVADO: { label: "Aprovado", variant: "success" },
    REPROVADO: { label: "Reprovado", variant: "danger" },
    CANCELADO: { label: "Cancelado", variant: "danger" },
  };

  const trabalhosFiltrados =
    filtroStatus === "todos" ? trabalhos : trabalhos.filter((t) => t.status === filtroStatus);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-16 h-16 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin mb-6"></div>
        <p className="text-[var(--muted)] font-black uppercase tracking-widest text-xs">
          Sincronizando Dados...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in relative">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-[var(--primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Cabeçalho com botão Novo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div>
          <Badge
            variant="info"
            className="mb-4 bg-[var(--primary-light)]/10 text-[var(--primary)] ring-1 ring-[var(--primary-light)] px-3 py-1 text-[10px] font-black uppercase tracking-widest"
          >
            Repositório de Produção
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-[var(--foreground)] font-[Plus\ Jakarta\ Sans] leading-tight">
            Trabalhos{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[#7C3AED]">
              Acadêmicos
            </span>
          </h2>
          <p className="text-[var(--muted)] text-base font-medium mt-2 max-w-xl">
            Acompanhe o status das submissões, prazos e feedbacks da comissão orientadora.
          </p>
        </div>
        {canCreate && (
          <Link href="/trabalhos/cadastrar">
            <Button
              variant="gradient"
              size="lg"
              className="rounded-2xl shadow-xl shadow-indigo-500/10 px-8 py-5 text-base font-black tracking-tight"
            >
              <Plus className="mr-3 h-5 w-5" />
              Novo Trabalho
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros Premium */}
      <div className="relative z-10">
        <div className="bg-[var(--surface)]/80 backdrop-blur-xl p-2 rounded-[28px] border border-[var(--border)] shadow-xl flex flex-wrap items-center gap-1">
          <button
            onClick={() => setFiltroStatus("todos")}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              filtroStatus === "todos"
                ? "bg-[var(--foreground)] text-white shadow-lg"
                : "text-[var(--muted)] hover:bg-[var(--surface-light)] hover:text-[var(--foreground)]"
            }`}
          >
            Todos os Projetos
          </button>
          <div className="w-px h-6 bg-[var(--border-light)] mx-2 hidden sm:block"></div>
          {Object.entries(statusConfig).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                filtroStatus === status
                  ? "bg-[var(--primary)] text-white shadow-lg shadow-indigo-500/20"
                  : "text-[var(--muted)] hover:bg-[var(--surface-light)] hover:text-[var(--foreground)]"
              }`}
            >
              <div
                className={`w-1 h-1 rounded-full ${filtroStatus === status ? "bg-white" : "bg-[var(--muted-light)]"}`}
              ></div>
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Trabalhos optimized for Bento Grid aesthetic */}
      <div className="grid grid-cols-1 gap-6 relative z-10">
        {trabalhosFiltrados.length === 0 ? (
          <div className="bg-[var(--surface)] p-20 rounded-[40px] border border-dashed border-[var(--border)] text-center animate-fade-in">
            <div className="w-20 h-20 bg-[var(--surface-light)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FileText className="w-10 h-10 text-[var(--muted-light)]" />
            </div>
            <h3 className="text-xl font-black text-[var(--foreground)] mb-2">
              Nenhum registro encontrado
            </h3>
            <p className="text-[var(--muted)] font-medium max-w-xs mx-auto">
              Tente ajustar seus filtros ou cadastre um novo trabalho acadêmico.
            </p>
          </div>
        ) : (
          trabalhosFiltrados.map((trabalho, idx) => (
            <Card
              key={trabalho.id}
              className="surface-card group overflow-hidden border border-[var(--border)] hover:border-[var(--primary-light)] transition-all duration-500 rounded-[32px] p-0"
            >
              <div className="flex flex-col lg:flex-row h-full">
                <CardContent className="p-8 lg:p-10 flex-1 relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <FileText className="w-32 h-32" />
                  </div>

                  <div className="flex flex-col h-full justify-between gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <Badge
                          variant={statusConfig[trabalho.status]?.variant || "default"}
                          className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm"
                        >
                          {statusConfig[trabalho.status]?.label || trabalho.status}
                        </Badge>
                        <span className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest bg-[var(--surface-light)]/50 px-3 py-1.5 rounded-full border border-[var(--border-light)]">
                          ID: {trabalho.id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-black text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 mb-3 tracking-tight font-[Plus\ Jakarta\ Sans]">
                        {trabalho.titulo}
                      </h3>
                      <p className="text-[var(--muted)] font-medium line-clamp-2 mb-0 max-w-3xl leading-relaxed">
                        {trabalho.descricao}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-[var(--border-light)]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--primary-light)]/40 flex items-center justify-center border border-[var(--primary-light)]/20 shadow-sm">
                          <User className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                            Autor
                          </p>
                          <p className="font-bold text-[var(--foreground)] truncate">
                            {trabalho.aluno?.nome || "Sistema"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--accent-light)]/40 flex items-center justify-center border border-[var(--accent-light)]/20 shadow-sm">
                          <Award className="w-5 h-5 text-[var(--accent)]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                            Orientador
                          </p>
                          <p className="font-bold text-[var(--foreground)] truncate">
                            {trabalho.orientador?.nome || "Substituir"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[var(--surface-light)] flex items-center justify-center border border-[var(--border-light)] shadow-sm">
                          <Calendar className="w-5 h-5 text-[var(--muted-light)]" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                            Sincronizado
                          </p>
                          <p className="font-bold text-[var(--foreground)] truncate">
                            {format(new Date(trabalho.dataInicio), "dd MMM, yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className="lg:w-64 bg-[var(--surface-light)]/30 backdrop-blur-sm lg:border-l border-[var(--border)] p-8 flex flex-col justify-center gap-4 group-hover:bg-[var(--surface-light)]/60 transition-all duration-500">
                  <Button
                    variant="gradient"
                    size="lg"
                    onClick={() => onSelectTrabalho?.(trabalho)}
                    className="w-full rounded-2xl shadow-xl shadow-indigo-500/10 py-5 font-black tracking-tight"
                  >
                    <Eye className="w-5 h-5 mr-3" />
                    Gerenciar
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    {canEdit(trabalho) && (
                      <Link href={`/trabalhos/${trabalho.id}/editar`} className="w-full">
                        <Button
                          variant="ghost"
                          size="md"
                          className="w-full rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--background)] py-4"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                    )}
                    {canSchedule(trabalho) && (
                      <Link
                        href={`/bancas/cadastrar?trabalhoId=${trabalho.id}`}
                        className="w-full"
                      >
                        <Button
                          variant="ghost"
                          size="md"
                          className="w-full rounded-xl border border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50 py-4"
                        >
                          <CalendarPlus className="w-4 h-4 mr-2" />
                          Agendar
                        </Button>
                      </Link>
                    )}
                  </div>

                  {canDelete(trabalho) && (
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() =>
                        setTrabalhoToDelete({ id: trabalho.id, titulo: trabalho.titulo })
                      }
                      className="w-full rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 py-4"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remover
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Confirmação de Exclusão Premium */}
      <ConfirmModal
        isOpen={!!trabalhoToDelete}
        onClose={() => !deletingId && setTrabalhoToDelete(null)}
        onConfirm={handleDelete}
        title="Remover Registro"
        message={`Você está prestes a remover o trabalho "${trabalhoToDelete?.titulo}". Esta ação é irreversível e apagará todo o histórico de versões e comentários associados.`}
        confirmText="Confirmar Remoção"
        cancelText="Manter Registro"
        variant="danger"
        isLoading={!!deletingId}
      />
    </div>
  );
}
