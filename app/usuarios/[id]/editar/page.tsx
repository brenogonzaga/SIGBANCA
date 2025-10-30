"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useToast } from "@/app/components/ui/Toast";
import { PublicHeader } from "@/app/components/ui/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { UserRole } from "@prisma/client";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  role: UserRole;
  ativo: boolean;
  matricula?: string;
  curso?: string;
  dataIngresso?: string;
  titulacao?: string;
  departamento?: string;
  areaAtuacao?: string;
  lattes?: string;
}

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { token, usuario: currentUser } = useAuth();
  const { showToast } = useToast();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    role: "ALUNO" as UserRole,
    ativo: true,
    senha: "",
    matricula: "",
    curso: "",
    dataIngresso: "",
    titulacao: "",
    departamento: "",
    areaAtuacao: "",
    lattes: "",
  });

  useEffect(() => {
    params.then((p) => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (!token || !currentUser) {
      router.push("/login");
      return;
    }

    const isSelfEdit = currentUser.id === userId;
    const isAdminOrCoord = currentUser.role === "ADMIN" || currentUser.role === "COORDENADOR";

    if (!isSelfEdit && !isAdminOrCoord) {
      showToast("Você não tem permissão para editar este perfil", "error");
      router.push("/dashboard");
      return;
    }

    async function fetchUsuario() {
      try {
        const response = await fetch(`/api/usuarios/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsuario(data);
          setFormData({
            nome: data.nome || "",
            email: data.email || "",
            cpf: data.cpf || "",
            telefone: data.telefone || "",
            role: data.role || "ALUNO",
            ativo: data.ativo ?? true,
            senha: "",
            matricula: data.matricula || "",
            curso: data.curso || "",
            dataIngresso: data.dataIngresso
              ? new Date(data.dataIngresso).toISOString().split("T")[0]
              : "",
            titulacao: data.titulacao || "",
            departamento: data.departamento || "",
            areaAtuacao: data.areaAtuacao || "",
            lattes: data.lattes || "",
          });
        } else {
          router.push("/usuarios");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId, currentUser, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updateData: Record<string, unknown> = {
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        ativo: formData.ativo,
      };

      if (formData.senha) {
        updateData.senha = formData.senha;
      }

      if (formData.role === "ALUNO") {
        updateData.matricula = formData.matricula;
        updateData.curso = formData.curso;
        if (formData.dataIngresso) {
          updateData.dataIngresso = formData.dataIngresso;
        }
      } else if (
        formData.role === "PROFESSOR" ||
        formData.role === "PROFESSOR_BANCA" ||
        formData.role === "COORDENADOR"
      ) {
        updateData.titulacao = formData.titulacao;
        updateData.departamento = formData.departamento;
        updateData.areaAtuacao = formData.areaAtuacao;
        updateData.lattes = formData.lattes;
      }

      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showToast("Usuário atualizado com sucesso!", "success");
        setTimeout(() => router.push("/usuarios"), 1000);
      } else {
        const error = await response.json();
        showToast(`Erro ao atualizar usuário: ${error.error}`, "error");
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      showToast("Erro ao atualizar usuário", "error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <PublicHeader showBackButton backUrl="/usuarios" title="Editar Usuário" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <>
      <PublicHeader showBackButton backUrl="/usuarios" title="Editar Usuário" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Editar Usuário</CardTitle>
                <Badge variant={formData.ativo ? "success" : "danger"}>
                  {formData.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informações Básicas */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        E-mail (não editável)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        CPF
                      </label>
                      <input
                        type="text"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="000.000.000-00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nova Senha (deixe em branco para não alterar)
                      </label>
                      <input
                        type="password"
                        value={formData.senha}
                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.ativo ? "true" : "false"}
                        onChange={(e) =>
                          setFormData({ ...formData, ativo: e.target.value === "true" })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Campos específicos para Aluno */}
                {formData.role === "ALUNO" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                      Dados Acadêmicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Matrícula
                        </label>
                        <input
                          type="text"
                          value={formData.matricula}
                          onChange={(e) =>
                            setFormData({ ...formData, matricula: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Curso
                        </label>
                        <input
                          type="text"
                          value={formData.curso}
                          onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Data de Ingresso
                        </label>
                        <input
                          type="date"
                          value={formData.dataIngresso}
                          onChange={(e) =>
                            setFormData({ ...formData, dataIngresso: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos específicos para Professor */}
                {(formData.role === "PROFESSOR" ||
                  formData.role === "PROFESSOR_BANCA" ||
                  formData.role === "COORDENADOR") && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                      Dados Profissionais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Titulação
                        </label>
                        <input
                          type="text"
                          value={formData.titulacao}
                          onChange={(e) =>
                            setFormData({ ...formData, titulacao: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Ex: Dr., Me., Esp."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Departamento
                        </label>
                        <input
                          type="text"
                          value={formData.departamento}
                          onChange={(e) =>
                            setFormData({ ...formData, departamento: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Área de Atuação
                        </label>
                        <input
                          type="text"
                          value={formData.areaAtuacao}
                          onChange={(e) =>
                            setFormData({ ...formData, areaAtuacao: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Currículo Lattes
                        </label>
                        <input
                          type="url"
                          value={formData.lattes}
                          onChange={(e) => setFormData({ ...formData, lattes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="http://lattes.cnpq.br/..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Botões */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push("/usuarios")}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
