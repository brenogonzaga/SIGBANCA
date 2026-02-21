"use client";

import React, { useState, useEffect } from "react";
import { TrabalhoStatus } from "@/app/types";
import { TrabalhoListItem } from "@/app/types/custom";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { FileText, User, Calendar, Eye, Plus, Edit, Trash2 } from "lucide-react";
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando trabalhos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com botão Novo */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trabalhos</h2>
        {canCreate && (
          <Link href="/trabalhos/cadastrar">
            <Button variant="gradient">
              <Plus className="mr-2 h-4 w-4" />
              Novo Trabalho
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filtroStatus === "todos" ? "primary" : "secondary"}
          onClick={() => setFiltroStatus("todos")}
        >
          Todos
        </Button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <Button
            key={status}
            size="sm"
            variant={filtroStatus === status ? "primary" : "secondary"}
            onClick={() => setFiltroStatus(status as TrabalhoStatus)}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Lista de Trabalhos */}
      <div className="space-y-4">
        {trabalhosFiltrados.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                Nenhum trabalho encontrado.
              </p>
            </CardContent>
          </Card>
        ) : (
          trabalhosFiltrados.map((trabalho) => (
            <Card key={trabalho.id} hover>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {trabalho.titulo}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {trabalho.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{trabalho.aluno?.nome || "Aluno não informado"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>
                          Orientador:{" "}
                          {trabalho.orientador?.titulacao
                            ? `${trabalho.orientador.titulacao} `
                            : ""}
                          {trabalho.orientador?.nome || "Não informado"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Início:{" "}
                          {format(new Date(trabalho.dataInicio), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusConfig[trabalho.status]?.variant || "default"}>
                        {statusConfig[trabalho.status]?.label || trabalho.status}
                      </Badge>
                      {trabalho.versoes && trabalho.versoes.length > 0 && (
                        <Badge variant="default">
                          Versão {trabalho.versoes[0].numeroVersao}
                        </Badge>
                      )}
                      {trabalho.aluno?.curso && (
                        <Badge variant="info">{trabalho.aluno.curso}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2">
                    <Button size="sm" onClick={() => onSelectTrabalho?.(trabalho)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                    {canEdit(trabalho) && (
                      <Link href={`/trabalhos/${trabalho.id}/editar`}>
                        <Button variant="outline" size="sm" className="w-full md:w-auto">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                    )}
                    {canDelete(trabalho) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setTrabalhoToDelete({ id: trabalho.id, titulo: trabalho.titulo })
                        }
                        className="w-full md:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={!!trabalhoToDelete}
        onClose={() => !deletingId && setTrabalhoToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Trabalho"
        message={`Tem certeza que deseja excluir o trabalho "${trabalhoToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        isLoading={!!deletingId}
      />
    </div>
  );
}
