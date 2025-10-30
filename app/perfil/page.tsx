"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Building,
  Edit,
  FileText,
  Users,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigation } from "../components/layout/Navigation";

const roleLabels: Record<string, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  COORDENADOR: "Coordenador",
  PROFESSOR_BANCA: "Avaliador",
  ADMIN: "Administrador",
};

const roleColors: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  ALUNO: "default",
  PROFESSOR: "info",
  COORDENADOR: "success",
  PROFESSOR_BANCA: "warning",
  ADMIN: "danger",
};

export default function PerfilPage() {
  const router = useRouter();
  const { usuario, token } = useAuth();
  const [stats, setStats] = useState<{
    trabalhos?: number;
    bancas?: number;
    orientacoes?: number;
  }>({});
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!token || !usuario) return;

      try {
        if (usuario.role === "ALUNO") {
          const response = await fetch(`/api/trabalhos?alunoId=${usuario.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setStats({ trabalhos: data.length });
          }
        } else if (usuario.role === "PROFESSOR" || usuario.role === "COORDENADOR") {
          const [trabalhosRes, bancasRes] = await Promise.all([
            fetch(`/api/trabalhos?orientadorId=${usuario.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/bancas", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const trabalhos = trabalhosRes.ok ? await trabalhosRes.json() : [];
          const bancas = bancasRes.ok ? await bancasRes.json() : [];

          setStats({
            orientacoes: trabalhos.length,
            bancas: bancas.filter((b: { membros: { usuarioId: string }[] }) =>
              b.membros.some((m: { usuarioId: string }) => m.usuarioId === usuario.id)
            ).length,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchStats();
  }, [token, usuario]);

  if (!usuario) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation activeView="dashboard" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
            <Button
              variant="outline"
              onClick={() => router.push(`/usuarios/${usuario.id}/editar`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </div>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {usuario.nome}
                      </h2>
                      <Badge variant={roleColors[usuario.role]}>
                        {roleLabels[usuario.role] || usuario.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Mail size={20} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Email</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {usuario.email}
                      </p>
                    </div>
                  </div>

                  {usuario.telefone && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone size={20} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Telefone</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {usuario.telefone}
                        </p>
                      </div>
                    </div>
                  )}

                  {usuario.cpf && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <User size={20} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">CPF</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {usuario.cpf}
                        </p>
                      </div>
                    </div>
                  )}

                  {usuario.createdAt && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Calendar size={20} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Membro desde</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {format(new Date(usuario.createdAt), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Informações Específicas do Aluno */}
            {usuario.role === "ALUNO" && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Dados Acadêmicos
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {usuario.matricula && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <BookOpen size={20} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Matrícula</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {usuario.matricula}
                          </p>
                        </div>
                      </div>
                    )}

                    {usuario.curso && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Building size={20} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Curso</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {usuario.curso}
                          </p>
                        </div>
                      </div>
                    )}

                    {usuario.dataIngresso && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Calendar size={20} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Data de Ingresso
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {format(new Date(usuario.dataIngresso), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Informações Específicas do Professor */}
            {(usuario.role === "PROFESSOR" ||
              usuario.role === "COORDENADOR" ||
              usuario.role === "PROFESSOR_BANCA") && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Dados Profissionais
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {usuario.titulacao && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Award size={20} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Titulação</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {usuario.titulacao}
                          </p>
                        </div>
                      </div>
                    )}

                    {usuario.departamento && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Building size={20} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Departamento
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {usuario.departamento}
                          </p>
                        </div>
                      </div>
                    )}

                    {usuario.areaAtuacao && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <BookOpen size={20} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Área de Atuação
                          </p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {usuario.areaAtuacao}
                          </p>
                        </div>
                      </div>
                    )}

                    {usuario.lattes && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Award size={20} />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Lattes</p>
                          <a
                            href={usuario.lattes}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Ver currículo
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Estatísticas */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Estatísticas
                </h3>

                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {usuario.role === "ALUNO" && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {stats.trabalhos || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.trabalhos === 1 ? "Trabalho" : "Trabalhos"}
                          </p>
                        </div>
                      </div>
                    )}

                    {(usuario.role === "PROFESSOR" || usuario.role === "COORDENADOR") && (
                      <>
                        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {stats.orientacoes || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {stats.orientacoes === 1 ? "Orientação" : "Orientações"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {stats.bancas || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {stats.bancas === 1 ? "Banca" : "Bancas"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Ações Rápidas
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {usuario.role === "ALUNO" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/trabalhos")}
                        className="justify-start"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Meus Trabalhos
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/trabalhos/cadastrar")}
                        className="justify-start"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Novo Trabalho
                      </Button>
                    </>
                  )}

                  {(usuario.role === "PROFESSOR" ||
                    usuario.role === "COORDENADOR" ||
                    usuario.role === "PROFESSOR_BANCA") && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/trabalhos")}
                        className="justify-start"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Ver Trabalhos
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/bancas")}
                        className="justify-start"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Ver Bancas
                      </Button>
                    </>
                  )}

                  {(usuario.role === "COORDENADOR" || usuario.role === "ADMIN") && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/usuarios")}
                        className="justify-start"
                      >
                        <User className="w-5 h-5 mr-2" />
                        Gerenciar Usuários
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/bancas/cadastrar")}
                        className="justify-start"
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Nova Banca
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
