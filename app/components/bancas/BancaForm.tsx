"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { X, Plus } from "lucide-react";
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
      const response = await fetch("/api/trabalhos", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{bancaId ? "Editar Banca" : "Nova Banca"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trabalho */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Trabalho *
            </label>
            <select
              required
              value={formData.trabalhoId}
              onChange={(e) => setFormData({ ...formData, trabalhoId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!bancaId || isLoadingTrabalhos}
            >
              <option value="">
                {isLoadingTrabalhos ? "Carregando trabalhos..." : "Selecione um trabalho"}
              </option>
              {trabalhos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo} - {t.aluno.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data e Horário */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Horário *
              </label>
              <input
                type="time"
                required
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Local *
            </label>
            <input
              type="text"
              required
              value={formData.local}
              onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              placeholder="Ex: Sala 201, Auditório Principal"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Modalidade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Modalidade *
            </label>
            <select
              required
              value={formData.modalidade}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  modalidade: e.target.value as "PRESENCIAL" | "REMOTO" | "HIBRIDO",
                })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            >
              <option value="PRESENCIAL">Presencial</option>
              <option value="REMOTO">Remoto</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </div>

          {/* Link da Reunião */}
          {(formData.modalidade === "REMOTO" || formData.modalidade === "HIBRIDO") && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Link da Reunião *
              </label>
              <input
                type="url"
                required
                value={formData.linkReuniao}
                onChange={(e) => setFormData({ ...formData, linkReuniao: e.target.value })}
                placeholder="https://meet.google.com/..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Insira o link completo da reunião online (ex: Google Meet, Zoom, Teams)
              </p>
            </div>
          )}

          {/* Membros da Banca */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Membros da Banca *
              </label>
              <Button type="button" variant="outline" size="sm" onClick={addMembro}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Membro
              </Button>
            </div>

            <div className="space-y-3">
              {formData.membros.map((membro, index) => (
                <div
                  key={index}
                  className="flex gap-3 items-start p-4 border border-gray-200 dark:border-gray-700 rounded-xl"
                >
                  <div className="flex-1 grid md:grid-cols-2 gap-3">
                    <select
                      required
                      value={membro.usuarioId}
                      onChange={(e) => updateMembro(index, "usuarioId", e.target.value)}
                      disabled={isLoadingProfessores}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {isLoadingProfessores
                          ? "Carregando professores..."
                          : "Selecione o professor"}
                      </option>
                      {professores.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titulacao ? `${p.titulacao} ` : ""}
                          {p.nome}
                        </option>
                      ))}
                    </select>

                    <select
                      required
                      value={membro.papel}
                      onChange={(e) => updateMembro(index, "papel", e.target.value)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    >
                      <option value="ORIENTADOR">Orientador</option>
                      <option value="AVALIADOR">Avaliador</option>
                      <option value="SUPLENTE">Suplente</option>
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeMembro(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {formData.membros.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhum membro adicionado. Clique em &quot;Adicionar Membro&quot; para começar.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="gradient" isLoading={isLoading}>
          {bancaId ? "Atualizar Banca" : "Criar Banca"}
        </Button>
      </div>
    </form>
  );
}

export default BancaForm;
