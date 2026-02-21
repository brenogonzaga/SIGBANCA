"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ConfirmModal } from "../ui/Modal";
import { UserRole } from "@/app/types/custom";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "../ui/Toast";
import { User, Mail, BookOpen, GraduationCap, Edit, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  matricula?: string | null;
  curso?: string | null;
  titulacao?: string | null;
  departamento?: string | null;
}

export function UsuarioList() {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroRole, setFiltroRole] = useState<string>("todos");
  const [usuarioToDelete, setUsuarioToDelete] = useState<{ id: string; nome: string } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR";
  const canDelete = usuario?.role === "ADMIN"; // Apenas ADMIN pode deletar

  useEffect(() => {
    async function fetchUsuarios() {
      if (!token) return;

      try {
        const response = await fetch("/api/usuarios", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsuarios(data);
        } else if (response.status === 401) {
        } else {
          console.error("Erro ao carregar usuários");
        }
      } catch (error) {
        console.error("Erro de conexão ao carregar usuários:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsuarios();
  }, [token]);

  const handleDelete = async () => {
    if (!usuarioToDelete || !token) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/usuarios/${usuarioToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUsuarios(usuarios.filter((u) => u.id !== usuarioToDelete.id));
        setUsuarioToDelete(null);
        showToast("Usuário excluído com sucesso", "success");
      } else {
        const error = await response.json();
        let errorMessage = "Erro ao excluir usuário";

        if (response.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente";
          router.push("/login");
        } else if (response.status === 403) {
          errorMessage = "Você não tem permissão para excluir este usuário";
        } else if (response.status === 400) {
          errorMessage = error.error || "Dados inválidos para exclusão";
        } else if (response.status === 404) {
          errorMessage = "Usuário não encontrado";
        } else if (error.error) {
          errorMessage = error.error;
        }

        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      showToast("Erro de conexão. Verifique sua internet e tente novamente", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const roleConfig: Record<
    UserRole,
    { label: string; variant: "default" | "success" | "warning" | "info" | "danger" }
  > = {
    ALUNO: { label: "Aluno", variant: "info" },
    PROFESSOR: { label: "Professor", variant: "success" },
    COORDENADOR: { label: "Coordenador", variant: "warning" },
    PROFESSOR_BANCA: { label: "Professor de Banca", variant: "default" },
    ADMIN: { label: "Administrador", variant: "danger" },
  };

  const usuariosFiltrados =
    filtroRole === "todos" ? usuarios : usuarios.filter((u) => u.role === filtroRole);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Usuários</h2>
        {(usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR") && (
          <Link href="/usuarios/cadastrar">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
          </Link>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroRole("todos")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroRole === "todos"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              Todos ({usuarios.length})
            </button>
            {Object.entries(roleConfig).map(([role, config]) => {
              const count = usuarios.filter((u) => u.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setFiltroRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroRole === role
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {config.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid gap-4">
        {usuariosFiltrados.length === 0 ? (
          <Card>
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum usuário encontrado
            </div>
          </Card>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <Card key={usuario.id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {usuario.nome}
                      </h3>
                      <Badge variant={roleConfig[usuario.role]?.variant || "default"}>
                        {roleConfig[usuario.role]?.label || usuario.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={usuario.ativo ? "success" : "danger"}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <div className="flex gap-2">
                      {canEdit && (
                        <button
                          onClick={() => router.push(`/usuarios/${usuario.id}/editar`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center"
                          title="Editar usuário"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() =>
                            setUsuarioToDelete({ id: usuario.id, nome: usuario.nome })
                          }
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center"
                          title="Excluir usuário"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{usuario.email}</span>
                  </div>

                  {usuario.matricula && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>Matrícula: {usuario.matricula}</span>
                    </div>
                  )}

                  {usuario.curso && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>{usuario.curso}</span>
                    </div>
                  )}

                  {usuario.titulacao && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Titulação: {usuario.titulacao}</span>
                    </div>
                  )}

                  {usuario.departamento && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Departamento:</strong> {usuario.departamento}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!usuarioToDelete}
        onClose={() => setUsuarioToDelete(null)}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o usuário "${usuarioToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isLoading={isDeleting}
      />
    </div>
  );
}
