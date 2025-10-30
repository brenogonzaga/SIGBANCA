"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Save } from "lucide-react";
import jwt from "jsonwebtoken";

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  COORDENADOR: "Coordenador",
  PROFESSOR: "Professor",
  PROFESSOR_BANCA: "Professor de Banca",
  ALUNO: "Aluno",
};

export default function CadastrarUsuarioPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome: "",
    cpf: "",
    telefone: "",
    role: "ALUNO",
    matricula: "",
    curso: "",
    dataIngresso: "",
    titulacao: "",
    departamento: "",
    areaAtuacao: "",
    lattes: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwt.decode(token) as JWTPayload;
      setUserRole(decoded.role);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload: Record<string, unknown> = {
        email: formData.email,
        senha: formData.senha,
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone || undefined,
        role: formData.role,
      };

      if (formData.role === "ALUNO") {
        payload.matricula = formData.matricula;
        payload.curso = formData.curso;
        if (formData.dataIngresso) {
          payload.dataIngresso = formData.dataIngresso;
        }
      }

      if (
        formData.role === "PROFESSOR" ||
        formData.role === "PROFESSOR_BANCA" ||
        formData.role === "COORDENADOR"
      ) {
        if (formData.titulacao) payload.titulacao = formData.titulacao;
        if (formData.departamento) payload.departamento = formData.departamento;
        if (formData.areaAtuacao) payload.areaAtuacao = formData.areaAtuacao;
        if (formData.lattes) payload.lattes = formData.lattes;
      }

      const response = await fetch("/api/usuarios/cadastrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Usuário cadastrado com sucesso!");
        router.push("/usuarios");
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      alert("Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableRoles = () => {
    if (userRole === "ADMIN") {
      return ["ADMIN", "COORDENADOR", "PROFESSOR", "PROFESSOR_BANCA", "ALUNO"];
    } else if (userRole === "COORDENADOR") {
      return ["PROFESSOR", "PROFESSOR_BANCA", "ALUNO"];
    } else if (userRole === "PROFESSOR") {
      return ["ALUNO"];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  const isAluno = formData.role === "ALUNO";
  const isProfessor =
    formData.role === "PROFESSOR" ||
    formData.role === "PROFESSOR_BANCA" ||
    formData.role === "COORDENADOR";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-8 h-8" />
          Cadastrar Novo Usuário
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Preencha os dados abaixo para criar um novo usuário
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card de Dados Básicos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Dados Básicos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CPF *
              </label>
              <input
                type="text"
                required
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Senha *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Usuário *
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card de Dados de Aluno */}
        {isAluno && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Dados do Aluno
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Matrícula *
                </label>
                <input
                  type="text"
                  required
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Curso *
                </label>
                <input
                  type="text"
                  required
                  value={formData.curso}
                  onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Ingresso
                </label>
                <input
                  type="date"
                  value={formData.dataIngresso}
                  onChange={(e) => setFormData({ ...formData, dataIngresso: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Card de Dados de Professor */}
        {isProfessor && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Dados do Professor
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titulação
                </label>
                <input
                  type="text"
                  value={formData.titulacao}
                  onChange={(e) => setFormData({ ...formData, titulacao: e.target.value })}
                  placeholder="Dr., MSc., Esp., etc."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Área de Atuação
                </label>
                <input
                  type="text"
                  value={formData.areaAtuacao}
                  onChange={(e) => setFormData({ ...formData, areaAtuacao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lattes
                </label>
                <input
                  type="text"
                  value={formData.lattes}
                  onChange={(e) => setFormData({ ...formData, lattes: e.target.value })}
                  placeholder="URL do Currículo Lattes"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Cadastrando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Cadastrar Usuário
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
