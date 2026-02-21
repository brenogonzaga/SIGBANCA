"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { X, Plus, Calendar, BookOpen, MapPin, Globe, User } from "lucide-react";
import { VALIDATION_CONFIG, VALIDATION_MESSAGES } from "@/app/config";

interface BancaFormProps {
  bancaId?: string;
  onSuccess?: () => void;
}

interface Trabalho {
  id: string;
  titulo: string;
  aluno: {
    nome: string;
  };
}

interface Usuario {
  id: string;
  nome: string;
  titulacao?: string;
}

interface MembroBanca {
  usuarioId: string;
  papel: "ORIENTADOR" | "AVALIADOR" | "SUPLENTE";
}

export function BancaForm({ bancaId, onSuccess }: BancaFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTrabalhos, setIsLoadingTrabalhos] = useState(true);
  const [isLoadingProfessores, setIsLoadingProfessores] = useState(true);
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([]);
  const [professores, setProfessores] = useState<Usuario[]>([]);

  const [formData, setFormData] = useState({
    trabalhoId: "",
    data: "",
    horario: "",
    local: "",
    modalidade: "PRESENCIAL" as "PRESENCIAL" | "REMOTO" | "HIBRIDO",
    linkReuniao: "",
    membros: [] as MembroBanca[],
  });

  useEffect(() => {
    loadTrabalhos();
    loadProfessores();
    if (bancaId) {
      loadBanca();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bancaId]);

  async function loadTrabalhos() {
    setIsLoadingTrabalhos(true);
    try {
      // Carregar apenas trabalhos aptos para agendar banca (APROVADO_ORIENTADOR ou AGUARDANDO_BANCA)
      const response = await fetch(
        "/api/trabalhos?status=APROVADO_ORIENTADOR,AGUARDANDO_BANCA",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTrabalhos(data);
      } else if (response.status === 401) {
        showToast("Sessão expirada. Faça login novamente", "warning");
        router.push("/login");
      } else if (response.status === 403) {
        showToast("Sem permissão para acessar trabalhos", "error");
      } else {
        showToast("Erro ao carregar trabalhos", "error");
      }
    } catch (error) {
      console.error("Erro ao carregar trabalhos:", error);
      showToast("Erro de conexão ao carregar trabalhos", "error");
    } finally {
      setIsLoadingTrabalhos(false);
    }
  }

  async function loadProfessores() {
    setIsLoadingProfessores(true);
    try {
      const response = await fetch("/api/usuarios?role=PROFESSOR,PROFESSOR_BANCA", {
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

  async function loadBanca() {
    try {
      const response = await fetch(`/api/bancas/${bancaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const banca = await response.json();
        setFormData({
          trabalhoId: banca.trabalhoId,
          data: new Date(banca.data).toISOString().split("T")[0],
          horario: banca.horario,
          local: banca.local,
          modalidade: banca.modalidade,
          linkReuniao: banca.linkReuniao || "",
          membros: banca.membros.map((m: { usuarioId: string; papel: string }) => ({
            usuarioId: m.usuarioId,
            papel: m.papel,
          })),
        });
      } else if (response.status === 401) {
        showToast("Sessão expirada. Faça login novamente", "warning");
        router.push("/login");
      } else if (response.status === 403) {
        showToast("Sem permissão para acessar esta banca", "error");
        router.push("/bancas");
      } else if (response.status === 404) {
        showToast("Banca não encontrada", "error");
        router.push("/bancas");
      } else {
        showToast("Erro ao carregar banca", "error");
      }
    } catch (error) {
      console.error("Erro ao carregar banca:", error);
      showToast("Erro de conexão ao carregar banca", "error");
    }
  }

  function addMembro() {
    setFormData({
      ...formData,
      membros: [...formData.membros, { usuarioId: "", papel: "AVALIADOR" }],
    });
  }

  function removeMembro(index: number) {
    setFormData({
      ...formData,
      membros: formData.membros.filter((_, i) => i !== index),
    });
  }

  function updateMembro(index: number, field: keyof MembroBanca, value: string) {
    const newMembros = [...formData.membros];
    newMembros[index] = { ...newMembros[index], [field]: value };
    setFormData({ ...formData, membros: newMembros });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.trabalhoId) {
        showToast(VALIDATION_MESSAGES.BANCA.TRABALHO_REQUIRED, "error");
        return;
      }

      const dataBanca = new Date(formData.data + "T" + formData.horario);
      const agora = new Date();

      if (dataBanca < agora) {
        showToast(VALIDATION_MESSAGES.BANCA.DATA_PASSADA, "error");
        return;
      }

      const minutosAntecedencia = (dataBanca.getTime() - agora.getTime()) / (1000 * 60);
      if (minutosAntecedencia < VALIDATION_CONFIG.BANCA.ANTECEDENCIA_MINIMA) {
        showToast(VALIDATION_MESSAGES.BANCA.ANTECEDENCIA_MINIMA, "error");
        return;
      }

      if (
        (formData.modalidade === "REMOTO" || formData.modalidade === "HIBRIDO") &&
        formData.linkReuniao
      ) {
        try {
          new URL(formData.linkReuniao);
        } catch {
          showToast(VALIDATION_MESSAGES.BANCA.LINK_INVALID, "error");
          return;
        }
      }

      if (
        (formData.modalidade === "REMOTO" || formData.modalidade === "HIBRIDO") &&
        !formData.linkReuniao.trim()
      ) {
        showToast(VALIDATION_MESSAGES.BANCA.LINK_REQUIRED, "error");
        return;
      }

      if (formData.membros.length === 0) {
        showToast(VALIDATION_MESSAGES.BANCA.MEMBROS_MIN, "error");
        return;
      }

      const membrosValidos = formData.membros.every((m) => m.usuarioId && m.papel);
      if (!membrosValidos) {
        showToast("Preencha todos os dados dos membros da banca", "error");
        return;
      }

      const usuariosIds = formData.membros.map((m) => m.usuarioId);
      const usuariosUnicos = new Set(usuariosIds);
      if (usuariosIds.length !== usuariosUnicos.size) {
        showToast(VALIDATION_MESSAGES.BANCA.MEMBRO_DUPLICADO, "error");
        return;
      }

      const url = bancaId ? `/api/bancas/${bancaId}` : "/api/bancas";
      const method = bancaId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast(
          bancaId ? "Banca atualizada com sucesso!" : "Banca criada com sucesso!",
          "success"
        );
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/bancas");
        }
      } else {
        const error = await response.json();
        let errorMessage = "Erro ao salvar banca";

        if (response.status === 401) {
          errorMessage = "Sessão expirada. Faça login novamente";
        } else if (response.status === 403) {
          errorMessage = "Você não tem permissão para criar/editar bancas";
        } else if (response.status === 400) {
          errorMessage = error.error || "Dados inválidos. Verifique os campos";
        } else if (error.error) {
          errorMessage = error.error;
        }

        showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Erro ao salvar banca:", error);
      let errorMessage = "Erro ao salvar banca";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in">
      <Card className="surface-card overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-amber-500/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Calendar className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans] leading-tight">
                  {bancaId ? "Refinar Defesa" : "Agendar Nova Defesa"}
                </h2>
                <p className="text-[var(--muted)] font-medium mt-1">Sincronize os avaliadores e defina os parâmetros do rito acadêmico.</p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {/* Trabalho Seletor */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">
                Projeto Acadêmico em Pauta <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <select
                  required
                  value={formData.trabalhoId}
                  onChange={(e) => setFormData({ ...formData, trabalhoId: e.target.value })}
                  className="w-full px-6 py-5 bg-[var(--background)] border border-[var(--border)] rounded-[24px] appearance-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/30 outline-none transition-all text-lg font-black text-[var(--foreground)] disabled:opacity-70 disabled:grayscale-[0.5]"
                  disabled={!!bancaId || isLoadingTrabalhos}
                >
                  <option value="">
                    {isLoadingTrabalhos ? "Carregando produções..." : "Selecione o trabalho para defesa"}
                  </option>
                  {trabalhos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.titulo} — {t.aluno.nome}
                    </option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Grid Logística */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-[var(--surface-light)]/40 rounded-[40px] border border-[var(--border)] shadow-inner">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Data</label>
                <input
                  type="date"
                  required
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Horário</label>
                <input
                  type="time"
                  required
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] outline-none transition-all font-bold text-[var(--foreground)]"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Modalidade</label>
                <select
                  required
                  value={formData.modalidade}
                  onChange={(e) => setFormData({ ...formData, modalidade: e.target.value as any })}
                  className="w-full px-5 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary-light)] outline-none transition-all font-bold text-[var(--foreground)] appearance-none"
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="REMOTO">Remoto</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </div>
            </div>

            {/* Local e Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Localização Física / Sala</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--muted-light)]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    placeholder="Ex: Auditorio III, bloco B"
                    className="w-full pl-14 pr-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium text-[var(--foreground)]"
                  />
                </div>
              </div>
              
              {(formData.modalidade === "REMOTO" || formData.modalidade === "HIBRIDO") && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1 block">Acesso Virtual (Link)</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--primary)]">
                       <Globe className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      required
                      value={formData.linkReuniao}
                      onChange={(e) => setFormData({ ...formData, linkReuniao: e.target.value })}
                      placeholder="https://zoom.us/j/..."
                      className="w-full pl-14 pr-6 py-4 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary)]/10 transition-all font-medium text-[var(--foreground)]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Banca / Avaliadores */}
            <div className="pt-10 border-t border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">Membros Avaliadores</h3>
                  <p className="text-sm text-[var(--muted)] font-medium">Selecione os professores que compõem a comissão julgadora.</p>
                </div>
                <button 
                  type="button" 
                  onClick={addMembro}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white font-black text-xs hover:shadow-xl hover:shadow-[var(--primary)]/20 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  CONVIDAR MEMBRO
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.membros.map((membro, index) => (
                  <div
                    key={index}
                    className="group relative p-6 bg-[var(--background)] border border-[var(--border)] rounded-[32px] hover:border-[var(--primary-light)] hover:shadow-2xl transition-all duration-500 animate-in zoom-in-95"
                  >
                    <button
                      type="button"
                      onClick={() => removeMembro(index)}
                      className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white dark:bg-[var(--surface)] text-[var(--danger)] shadow-lg flex items-center justify-center hover:bg-[var(--danger)] hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest block ml-1">Docente Escolhido</label>
                        <select
                          required
                          value={membro.usuarioId}
                          onChange={(e) => updateMembro(index, "usuarioId", e.target.value)}
                          disabled={isLoadingProfessores}
                          className="w-full px-5 py-4 bg-[var(--surface-light)] border border-transparent rounded-[20px] focus:ring-4 focus:ring-[var(--primary-light)] outline-none transition-all text-sm font-bold appearance-none shadow-inner"
                        >
                          <option value="">Selecione o professor...</option>
                          {professores.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.titulacao ? `${p.titulacao} ` : ""}{p.nome}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-[var(--muted)] uppercase tracking-widest block ml-1">Função</label>
                        <div className="flex gap-2">
                          {["ORIENTADOR", "AVALIADOR", "SUPLENTE"].map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => updateMembro(index, "papel", role)}
                              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all ${
                                membro.papel === role 
                                  ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/10" 
                                  : "bg-[var(--surface-light)] text-[var(--muted)] hover:text-[var(--foreground)]"
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {formData.membros.length === 0 && (
                  <div className="md:col-span-2 py-20 bg-[var(--surface-light)]/20 border border-dashed border-[var(--border)] rounded-[40px] text-center">
                    <div className="w-16 h-16 bg-[var(--background)] rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-[var(--border)] shadow-inner">
                       <User className="w-8 h-8 text-[var(--muted-light)]" />
                    </div>
                    <h4 className="text-xl font-black text-[var(--foreground)] mb-1">Banca Vazia</h4>
                    <p className="text-[var(--muted)] font-medium">Pelo menos um membro deve ser escalado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-8 py-4 text-sm font-black text-[var(--muted)] hover:text-[var(--foreground)] transition-colors uppercase tracking-[0.1em]"
        >
          Retornar
        </button>
        <Button 
          type="submit" 
          variant="gradient" 
          size="lg"
          isLoading={isLoading}
          className="rounded-2xl px-12 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl transition-all"
        >
          {bancaId ? "Salvar Alterações" : "Efetuar Agendamento"}
        </Button>
      </div>
    </form>
  );
}

export default BancaForm;
