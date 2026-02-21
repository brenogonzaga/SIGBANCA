"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "../components/ui/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Search, Filter, Calendar, User, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrabalhoPublico {
  id: string;
  titulo: string;
  descricao: string;
  palavrasChave: string[];
  curso: string;
  dataDefesa: string;
  aluno: {
    id: string;
    nome: string;
  };
  orientador: {
    id: string;
    nome: string;
    titulacao?: string;
  };
  versoes: Array<{
    id: string;
    numeroVersao: number;
    nomeArquivo: string;
  }>;
  banca?: {
    notaFinal?: number;
    resultado?: string;
    membros: Array<{
      papel: string;
      usuario: {
        nome: string;
        titulacao?: string;
      };
    }>;
  };
}

export default function TrabalhosPublicosPage() {
  const router = useRouter();
  const [trabalhos, setTrabalhos] = useState<TrabalhoPublico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cursoFilter, setCursoFilter] = useState("");
  const [anoFilter, setAnoFilter] = useState("");

  useEffect(() => {
    async function fetchTrabalhos() {
      try {
        const params = new URLSearchParams();
        if (cursoFilter) params.append("curso", cursoFilter);
        if (anoFilter) params.append("ano", anoFilter);

        const response = await fetch(`/api/trabalhos/publicos?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setTrabalhos(data);
        }
      } catch (error) {
        console.error("Erro ao carregar trabalhos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrabalhos();
  }, [cursoFilter, anoFilter]);

  const trabalhosFiltrados = trabalhos.filter((trabalho) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      trabalho.titulo.toLowerCase().includes(searchLower) ||
      trabalho.descricao.toLowerCase().includes(searchLower) ||
      trabalho.aluno.nome.toLowerCase().includes(searchLower) ||
      trabalho.palavrasChave.some((palavra) => palavra.toLowerCase().includes(searchLower))
    );
  });

  const cursos = Array.from(new Set(trabalhos.map((t) => t.curso)));
  const anos = Array.from(
    new Set(
      trabalhos
        .filter((t) => t.dataDefesa)
        .map((t) => new Date(t.dataDefesa).getFullYear().toString())
    )
  ).sort((a, b) => parseInt(b) - parseInt(a));

  if (isLoading) {
    return (
      <>
        <PublicHeader title="Trabalhos Públicos" />
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando trabalhos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicHeader title="Trabalhos Públicos" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Trabalhos de Conclusão de Curso
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Consulte os trabalhos aprovados e defendidos
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filtros e Busca */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Busca */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por título, autor, palavras-chave..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Filtro de Curso */}
                <div>
                  <select
                    value={cursoFilter}
                    onChange={(e) => setCursoFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos os cursos</option>
                    {cursos.map((curso) => (
                      <option key={curso} value={curso}>
                        {curso}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Ano */}
                <div>
                  <select
                    value={anoFilter}
                    onChange={(e) => setAnoFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos os anos</option>
                    {anos.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Filter className="w-4 h-4" />
                <span>
                  {trabalhosFiltrados.length} trabalho
                  {trabalhosFiltrados.length !== 1 ? "s" : ""} encontrado
                  {trabalhosFiltrados.length !== 1 ? "s" : ""}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Trabalhos */}
          <div className="grid gap-6">
            {trabalhosFiltrados.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum trabalho encontrado com os filtros selecionados.</p>
                </CardContent>
              </Card>
            ) : (
              trabalhosFiltrados.map((trabalho) => (
                <Card key={trabalho.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{trabalho.titulo}</CardTitle>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                          {trabalho.descricao}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Informações básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <strong>Autor:</strong> {trabalho.aluno.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <strong>Orientador:</strong> {trabalho.orientador.titulacao}{" "}
                          {trabalho.orientador.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          <strong>Curso:</strong> {trabalho.curso}
                        </span>
                      </div>
                      {trabalho.dataDefesa && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            <strong>Defesa:</strong>{" "}
                            {format(new Date(trabalho.dataDefesa), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Palavras-chave */}
                    {trabalho.palavrasChave.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {trabalho.palavrasChave.map((palavra, index) => (
                          <Badge key={index} variant="default">
                            {palavra}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Nota e Membros da Banca */}
                    {trabalho.banca && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-4 items-center">
                          {trabalho.banca.notaFinal && (
                            <div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Nota Final:{" "}
                              </span>
                              <Badge variant="success">
                                {trabalho.banca.notaFinal.toFixed(1)}
                              </Badge>
                            </div>
                          )}
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Banca:</strong>{" "}
                            {trabalho.banca.membros.map((m) => m.usuario.nome).join(", ")}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botão Ver Detalhes */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/trabalhos-publicos/${trabalho.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Link para Login */}
          <div className="mt-8 text-center">
            <Button variant="secondary" onClick={() => router.push("/login")}>
              Acessar Sistema Completo
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
