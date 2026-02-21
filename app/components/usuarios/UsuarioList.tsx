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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[var(--border-light)]">
        <div>
          <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
            Gestão de <span className="bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] bg-clip-text text-transparent italic">Estatutários</span>
          </h2>
          <p className="text-[var(--muted)] font-medium mt-1">Administre os perfis e permissões de acesso ao sistema.</p>
        </div>
        {(usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR") && (
          <Link href="/usuarios/cadastrar">
            <button className="group relative flex items-center gap-3 px-8 py-4 bg-[var(--foreground)] text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <UserPlus className="w-5 h-5 relative z-10" />
              <span className="text-sm font-black uppercase tracking-widest relative z-10">Novo Usuário</span>
            </button>
          </Link>
        )}
      </div>

      {/* Filters Section - Bento Style */}
      <div className="bg-[var(--surface-light)]/40 backdrop-blur-md p-6 rounded-[32px] border border-[var(--border)] border-dashed">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
            <User className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest">Filtrar por Categoria</h3>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setFiltroRole("todos")}
            className={`px-6 py-3 rounded-[16px] text-xs font-black transition-all duration-300 tracking-wider ${
              filtroRole === "todos"
                ? "bg-[var(--foreground)] text-white shadow-xl scale-105"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
            }`}
          >
            TODOS ({usuarios.length})
          </button>
          {Object.entries(roleConfig).map(([role, config]) => {
            const count = usuarios.filter((u) => u.role === role).length;
            return (
              <button
                key={role}
                onClick={() => setFiltroRole(role)}
                className={`px-6 py-3 rounded-[16px] text-xs font-black transition-all duration-300 tracking-wider ${
                  filtroRole === role
                    ? "bg-[var(--foreground)] text-white shadow-xl scale-105"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                }`}
              >
                {config.label.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* User Grid - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuariosFiltrados.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 py-20 bg-[var(--surface)] rounded-[40px] border border-[var(--border)] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-[var(--surface-light)] flex items-center justify-center text-[var(--muted-light)] mb-6">
              <User className="w-10 h-10" />
            </div>
            <p className="text-xl font-black text-[var(--foreground)] tracking-tight">Nenhum perfil identificado</p>
            <p className="text-[var(--muted)] font-medium">Não encontramos usuários para esta categoria.</p>
          </div>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <div 
              key={usuario.id} 
              className="group bg-[var(--surface)] hover:bg-[var(--surface-light)] rounded-[40px] border border-[var(--border)] transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--primary)]/5 hover:-translate-y-2 overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[#7C3AED]/10 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform duration-500">
                      <User className="w-8 h-8" />
                    </div>
                    {usuario.ativo ? (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[var(--surface)] shadow-lg animate-pulse"></div>
                    ) : (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-4 border-[var(--surface)] shadow-lg"></div>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {canEdit && (
                      <button
                        onClick={() => router.push(`/usuarios/${usuario.id}/editar`)}
                        className="w-10 h-10 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all shadow-sm"
                        title="Ajustar Perfil"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() =>
                          setUsuarioToDelete({ id: usuario.id, nome: usuario.nome })
                        }
                        className="w-10 h-10 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-all shadow-sm"
                        title="Revogar Acesso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-xl font-black text-[var(--foreground)] tracking-tight leading-tight group-hover:text-[var(--primary)] transition-colors">
                    {usuario.nome}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleConfig[usuario.role]?.variant || "default"} className="font-black text-[10px]">
                      {roleConfig[usuario.role]?.label.toUpperCase() || usuario.role}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-[var(--border-light)] border-dashed">
                  <div className="flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-light)] flex items-center justify-center">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{usuario.email}</span>
                  </div>

                  {usuario.matricula && (
                    <div className="flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-light)] flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-[var(--foreground)]">{usuario.matricula}</span>
                    </div>
                  )}

                  {usuario.curso && (
                    <div className="flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-light)] flex items-center justify-center">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{usuario.curso}</span>
                    </div>
                  )}

                  {usuario.titulacao && (
                    <div className="flex items-center gap-3 text-sm font-medium text-[var(--muted)]">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface-light)] flex items-center justify-center">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <span>{usuario.titulacao}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-[var(--surface-light)]/30 border-t border-[var(--border-light)] flex justify-between items-center px-8">
                  <span className="text-[10px] font-black text-[var(--muted-light)] tracking-widest uppercase">ID: {usuario.id.slice(-6)}</span>
                  <div className={`w-2 h-2 rounded-full ${usuario.ativo ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!usuarioToDelete}
        onClose={() => setUsuarioToDelete(null)}
        onConfirm={handleDelete}
        title="Revogar Acesso"
        message={`Tem certeza que deseja remover o acesso de "${usuarioToDelete?.nome}"? Esta operação é definitiva e impactará a estrutura acadêmica.`}
        confirmText="Confirmar Revogação"
        isLoading={isDeleting}
      />
    </div>
  );
}
