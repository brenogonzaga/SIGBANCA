"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { VALIDATION_CONFIG, VALIDATION_MESSAGES } from "@/app/config";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    confirmSenha: "",
    nome: "",
    role: "ALUNO",
    cpf: "",
    telefone: "",
    matricula: "",
    curso: "",
    titulacao: "",
    departamento: "",
    areaAtuacao: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.senha !== formData.confirmSenha) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.senha.length < VALIDATION_CONFIG.USUARIO.SENHA.MIN) {
      setError(VALIDATION_MESSAGES.USUARIO.SENHA_MIN);
      return;
    }

    setIsLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmSenha, ...dataToSend } = formData;
      await signup(dataToSend);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const isAluno = formData.role === "ALUNO";
  const isProfessor = ["PROFESSOR", "PROFESSOR_BANCA", "COORDENADOR"].includes(formData.role);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h1>
            <p className="text-gray-600">Sistema de Gerenciamento de Bancas Acadêmicas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dados Básicos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="nome"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nome Completo *
                  </label>
                  <input
                    id="nome"
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                    id="cpf"
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Telefone
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="senha"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Senha *
                  </label>
                  <input
                    id="senha"
                    type="password"
                    required
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmSenha"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirmar Senha *
                  </label>
                  <input
                    id="confirmSenha"
                    type="password"
                    required
                    value={formData.confirmSenha}
                    onChange={(e) => setFormData({ ...formData, confirmSenha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de Usuário */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuário *
              </label>
              <select
                id="role"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALUNO">Aluno</option>
                <option value="PROFESSOR">Professor Orientador</option>
                <option value="PROFESSOR_BANCA">Professor Avaliador de Banca</option>
                <option value="COORDENADOR">Coordenador de Curso</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {/* Dados do Aluno */}
            {isAluno && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Dados Acadêmicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="matricula"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Matrícula
                    </label>
                    <input
                      id="matricula"
                      type="text"
                      value={formData.matricula}
                      onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="curso"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Curso
                    </label>
                    <input
                      id="curso"
                      type="text"
                      value={formData.curso}
                      onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dados do Professor */}
            {isProfessor && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Dados Profissionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="titulacao"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Titulação
                    </label>
                    <select
                      id="titulacao"
                      value={formData.titulacao}
                      onChange={(e) => setFormData({ ...formData, titulacao: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione</option>
                      <option value="Esp.">Especialista</option>
                      <option value="MSc.">Mestre</option>
                      <option value="Dr.">Doutor</option>
                      <option value="Pós-Doc.">Pós-Doutor</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="departamento"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Departamento
                    </label>
                    <input
                      id="departamento"
                      type="text"
                      value={formData.departamento}
                      onChange={(e) =>
                        setFormData({ ...formData, departamento: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor="areaAtuacao"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Área de Atuação
                    </label>
                    <input
                      id="areaAtuacao"
                      type="text"
                      value={formData.areaAtuacao}
                      onChange={(e) =>
                        setFormData({ ...formData, areaAtuacao: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Faça login
              </Link>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
