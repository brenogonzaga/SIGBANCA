"use client";

import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { ConfirmModal } from "../ui/Modal";
import Link from "next/link";

interface Banca {
  id: string;
  data: string;
  horario: string;
  local: string;
  modalidade: string;
  status: string;
  notaFinal?: number | null;
  resultado?: "APROVADO" | "APROVADO_COM_RESSALVAS" | "REPROVADO" | null;
  trabalho: {
    id: string;
    titulo: string;
    aluno: {
      nome: string;
      curso: string;
    };
  };
  membros: Array<{
    id: string;
    usuarioId: string;
    papel: string;
    usuario: {
      nome: string;
      titulacao: string | null;
    };
  }>;
}

export function BancaList() {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bancaToDelete, setBancaToDelete] = useState<{
    id: string;
    titulo: string;
  } | null>(null);

  const canCreate = usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN";

  const canEdit = (banca: Banca) => {
    if (usuario?.role === "ADMIN") return true;
    return banca.membros.some((m) => m.usuarioId === usuario?.id);
  };

  const canDelete = (banca: Banca) => {
    if (usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR") {
      return banca.status !== "REALIZADA";
    }
    return false;
  };

  const handleDelete = async () => {
    if (!bancaToDelete) return;

    setDeletingId(bancaToDelete.id);
    try {
      const response = await fetch(`/api/bancas/${bancaToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = "Erro ao excluir banca";

        if (response.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente";
        } else if (response.status === 403) {
          errorMessage = "Você não tem permissão para excluir esta banca";
        } else if (response.status === 404) {
          errorMessage = "Banca não encontrada";
        } else if (response.status === 400) {
          errorMessage = error.message || "Não é possível excluir uma banca já realizada";
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      showToast("Banca excluída com sucesso!", "success");
      setBancas(bancas.filter((b) => b.id !== bancaToDelete.id));
      setBancaToDelete(null);
    } catch (error) {
      let errorMessage = "Erro ao excluir banca";

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
    async function fetchBancas() {
      if (!token) return;

      try {
        const response = await fetch("/api/bancas", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBancas(data);
        }
      } catch (error) {
        console.error("Erro ao carregar bancas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBancas();
  }, [token]);

  const statusConfig = {
    AGENDADA: { label: "Agendada", variant: "info" as const },
    EM_ANDAMENTO: { label: "Em Andamento", variant: "warning" as const },
    REALIZADA: { label: "Realizada", variant: "success" as const },
    CANCELADA: { label: "Cancelada", variant: "danger" as const },
  };

  const papelConfig = {
    ORIENTADOR: "Orientador",
    AVALIADOR: "Avaliador",
    SUPLENTE: "Suplente",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando bancas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bancas</h2>
        {canCreate && (
          <Link href="/bancas/cadastrar">
            <Button variant="gradient">
              <Plus className="mr-2 h-4 w-4" />
              Nova Banca
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {bancas.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhuma banca encontrada
            </div>
          </Card>
        ) : (
          bancas.map((banca) => (
            <Card key={banca.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {banca.trabalho.titulo}
                    </h3>
                    <Badge
                      variant={
                        statusConfig[banca.status as keyof typeof statusConfig]?.variant ||
                        "default"
                      }
                    >
                      {statusConfig[banca.status as keyof typeof statusConfig]?.label ||
                        banca.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {canEdit(banca) && (
                      <Link href={`/bancas/${banca.id}/editar`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {canDelete(banca) && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          setBancaToDelete({
                            id: banca.id,
                            titulo: banca.trabalho.titulo,
                          })
                        }
                        isLoading={deletingId === banca.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(banca.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}{" "}
                      às {banca.horario}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{banca.local}</span>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Trabalho:</strong> {banca.trabalho.titulo}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Aluno:</strong> {banca.trabalho.aluno.nome}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Curso:</strong> {banca.trabalho.aluno.curso}
                  </div>
                </div>

                {/* Resultado da Banca */}
                {banca.status === "REALIZADA" && (banca.resultado || banca.notaFinal != null) && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Resultado</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {banca.resultado && (
                        <Badge
                          variant={
                            banca.resultado === "APROVADO"
                              ? "success"
                              : banca.resultado === "REPROVADO"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {banca.resultado === "APROVADO"
                            ? "Aprovado"
                            : banca.resultado === "REPROVADO"
                            ? "Reprovado"
                            : "Aprovado com Ressalvas"}
                        </Badge>
                      )}
                      {banca.notaFinal != null && (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nota: <strong>{banca.notaFinal.toFixed(1)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      Membros da Banca
                    </span>
                  </div>
                  <div className="space-y-2">
                    {banca.membros.map((membro) => (
                      <div
                        key={membro.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {membro.usuario.titulacao ? `${membro.usuario.titulacao} ` : ""}
                          {membro.usuario.nome}
                        </span>
                        <Badge variant="default">
                          {papelConfig[membro.papel as keyof typeof papelConfig] ||
                            membro.papel}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!bancaToDelete}
        onClose={() => setBancaToDelete(null)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a banca "${bancaToDelete?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={!!deletingId}
      />
    </div>
  );
}
