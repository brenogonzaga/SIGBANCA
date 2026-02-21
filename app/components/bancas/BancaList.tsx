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

interface BancaListProps {
  initialBancas?: Banca[];
  hideHeader?: boolean;
}

export function BancaList({ initialBancas, hideHeader = false }: BancaListProps) {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const [bancas, setBancas] = useState<Banca[]>(initialBancas || []);
  const [isLoading, setIsLoading] = useState(!initialBancas);
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
    if (initialBancas) {
      setBancas(initialBancas);
      setIsLoading(false);
      return;
    }

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
  }, [token, initialBancas]);

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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      {!hideHeader && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[var(--border-light)]">
          <div>
            <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
              Comissões de <span className="bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] bg-clip-text text-transparent italic">Avaliação</span>
            </h2>
            <p className="text-[var(--muted)] font-medium mt-1">Acompanhe e gerencie as bancas examinadoras agendadas.</p>
          </div>
          {canCreate && (
            <Link href="/bancas/cadastrar">
              <button className="group relative flex items-center gap-3 px-8 py-4 bg-[var(--foreground)] text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/10">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="text-sm font-black uppercase tracking-widest relative z-10">Agendar Banca</span>
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Grid of Bancas - Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bancas.length === 0 ? (
          <div className="lg:col-span-2 py-20 bg-[var(--surface)] rounded-[40px] border border-[var(--border)] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-[var(--surface-light)] flex items-center justify-center text-[var(--muted-light)] mb-6">
              <Calendar className="w-10 h-10" />
            </div>
            <p className="text-xl font-black text-[var(--foreground)] tracking-tight">Nenhuma banca no horizonte</p>
            <p className="text-[var(--muted)] font-medium">Os agendamentos futuros aparecerão aqui.</p>
          </div>
        ) : (
          bancas.map((banca) => (
            <div 
              key={banca.id} 
              className="group bg-[var(--surface)] hover:bg-[var(--surface-light)] rounded-[40px] border border-[var(--border)] transition-all duration-500 hover:shadow-2xl hover:shadow-[var(--primary)]/5 hover:-translate-y-2 overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-2">
                    <Badge
                      variant={
                        statusConfig[banca.status as keyof typeof statusConfig]?.variant ||
                        "default"
                      }
                      className="font-black text-[10px] tracking-widest uppercase px-4 py-1.5"
                    >
                      {statusConfig[banca.status as keyof typeof statusConfig]?.label ||
                        banca.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {canEdit(banca) && (
                      <Link href={`/bancas/${banca.id}/editar`}>
                        <button className="w-10 h-10 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all shadow-sm">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                    )}
                    {canDelete(banca) && (
                      <button
                        onClick={() =>
                          setBancaToDelete({
                            id: banca.id,
                            titulo: banca.trabalho.titulo,
                          })
                        }
                        className="w-10 h-10 bg-white border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--danger)] hover:bg-red-50 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight mb-6 leading-tight group-hover:text-[var(--primary)] transition-colors">
                  {banca.trabalho.titulo}
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[var(--surface-light)]/50 p-4 rounded-3xl border border-[var(--border-light)]">
                    <div className="flex items-center gap-3 text-[var(--muted)] mb-1">
                       <Calendar className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Cronograma</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {format(new Date(banca.data), "dd/MM/yyyy", { locale: ptBR })} • {banca.horario}
                    </p>
                  </div>
                  <div className="bg-[var(--surface-light)]/50 p-4 rounded-3xl border border-[var(--border-light)]">
                    <div className="flex items-center gap-3 text-[var(--muted)] mb-1">
                       <MapPin className="w-3.5 h-3.5" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Recinto</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">
                      {banca.local}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8 pt-6 border-t border-[var(--border-light)] border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/10 to-[#7C3AED]/10 flex items-center justify-center text-[var(--primary)]">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Acadêmico</p>
                        <p className="text-sm font-bold text-[var(--foreground)]">{banca.trabalho.aluno.nome}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Comissão Examinadora</span>
                      <div className="h-[1px] flex-1 mx-4 bg-[var(--border-light)]"></div>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {banca.membros.map((membro) => (
                        <div 
                          key={membro.id}
                          className="px-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-full text-xs font-bold text-[var(--muted)] flex items-center gap-2 group/membro hover:border-[var(--primary-light)] hover:text-[var(--foreground)] transition-all"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/40 group-hover/membro:scale-150 transition-transform"></span>
                          {membro.usuario.nome}
                          <span className="text-[10px] opacity-40 font-black">({membro.papel.slice(0, 4)})</span>
                        </div>
                      ))}
                   </div>
                </div>

                 {/* Outcome Section - Bento Style */}
                 {banca.status === "REALIZADA" && (banca.resultado || banca.notaFinal != null) && (
                  <div className="mt-8 p-6 bg-gradient-to-br from-emerald-500/[0.03] to-emerald-500/[0.08] rounded-[32px] border border-emerald-500/20">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <Badge variant="success" className="bg-transparent border-none text-white p-0">
                                 {banca.notaFinal?.toFixed(1) || "P"}
                              </Badge>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Veredito Final</p>
                              <h4 className="text-lg font-black text-[var(--foreground)] tracking-tight">
                                {banca.resultado?.replace("_", " ") || "Avaliado"}
                              </h4>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-[var(--surface-light)]/30 border-t border-[var(--border-light)] flex justify-between items-center px-8">
                  <span className="text-[10px] font-black text-[var(--muted-light)] tracking-widest uppercase">ID: {banca.id.slice(-6)}</span>
                  <div className={`w-2 h-2 rounded-full ${banca.status === 'REALIZADA' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-400'}`}></div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!bancaToDelete}
        onClose={() => setBancaToDelete(null)}
        onConfirm={handleDelete}
        title="Revogar Agendamento"
        message={`Tem certeza que deseja desmarcar a banca de "${bancaToDelete?.titulo}"? Esta ação removerá a comissão do calendário acadêmico.`}
        confirmText="Confirmar Revogação"
        isLoading={!!deletingId}
      />
    </div>
  );
}
