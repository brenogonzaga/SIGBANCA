"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "../components/ui/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Search, Filter, Calendar, User, BookOpen, Award } from "lucide-react";
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
      <div className="min-h-screen bg-[var(--background)]">
        <PublicHeader title="Carregando..." />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[var(--primary-light)] border-t-[var(--primary)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[var(--primary)] animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-[var(--muted)] font-black text-xs uppercase tracking-[0.2em] animate-pulse">Consultando Acervo...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PublicHeader title="Acervo Digital" />
      <div className="min-h-screen bg-[var(--background)]">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-[var(--surface)] border-b border-[var(--border)] py-16 md:py-24">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.2]"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[var(--primary)]/10 to-transparent blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <Badge variant="info" className="mb-4 uppercase tracking-[0.2em] text-[10px] font-black py-1 px-4">Repositório Acadêmico</Badge>
              <h1 className="text-4xl md:text-6xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans] mb-6">
                Explore o Conhecimento Produzido
              </h1>
              <p className="text-lg text-[var(--muted)] font-medium leading-relaxed">
                Consulte os Trabalhos de Conclusão de Curso aprovados e defendidos pela nossa comunidade acadêmica.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filtros e Busca */}
          <Card className="surface-card mb-12">
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Busca */}
                <div className="lg:col-span-2">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] w-5 h-5 group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                      type="text"
                      placeholder="Buscar por título, autor, palavras-chave..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl focus:ring-4 focus:ring-[var(--primary-light)] focus:border-[var(--primary)] outline-none transition-all text-[var(--foreground)] placeholder:text-[var(--muted-light)]"
                    />
                  </div>
                </div>

                {/* Filtro de Curso */}
                <div>
                  <div className="relative">
                    <select
                      value={cursoFilter}
                      onChange={(e) => setCursoFilter(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl appearance-none focus:ring-4 focus:ring-[var(--primary-light)] focus:border-[var(--primary)] outline-none transition-all text-[var(--foreground)]"
                    >
                      <option value="">Cursos (Todos)</option>
                      {cursos.map((curso) => (
                        <option key={curso} value={curso}>
                          {curso}
                        </option>
                      ))}
                    </select>
                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
                  </div>
                </div>

                {/* Filtro de Ano */}
                <div>
                  <div className="relative">
                    <select
                      value={anoFilter}
                      onChange={(e) => setAnoFilter(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-[var(--background)] border border-[var(--border)] rounded-2xl appearance-none focus:ring-4 focus:ring-[var(--primary-light)] focus:border-[var(--primary)] outline-none transition-all text-[var(--foreground)]"
                    >
                      <option value="">Anos (Todos)</option>
                      {anos.map((ano) => (
                        <option key={ano} value={ano}>
                          {ano}
                        </option>
                      ))}
                    </select>
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)] uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {trabalhosFiltrados.length} Registros Encontrados
                  </span>
                </div>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="text-xs font-black text-[var(--danger)] hover:underline uppercase tracking-widest"
                  >
                    Limpar Busca
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Lista de Trabalhos */}
          <div className="grid gap-6">
            {trabalhosFiltrados.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-[var(--muted-light)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Nenhum resultado</h3>
                <p className="text-[var(--muted)] max-w-md mx-auto">Não encontramos trabalhos que correspondam aos seus critérios de busca.</p>
              </div>
            ) : (
              trabalhosFiltrados.map((trabalho) => (
                <Card key={trabalho.id} className="surface-card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="info" className="uppercase tracking-[0.1em] text-[10px] font-black">{trabalho.curso}</Badge>
                            {trabalho.banca?.notaFinal && trabalho.banca.notaFinal >= 9 && (
                              <Badge variant="success" className="uppercase tracking-[0.1em] text-[10px] font-black">
                                <Award className="w-3 h-3 mr-1" /> Destaque
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight leading-tight group-hover:text-[var(--primary)] transition-colors">
                            {trabalho.titulo}
                          </h2>
                          <p className="text-[var(--muted)] text-sm line-clamp-2 font-medium leading-relaxed">
                            {trabalho.descricao}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)]">
                              <User className="w-4 h-4 text-[var(--primary)]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-widest leading-none mb-1">Autor</p>
                              <p className="text-sm font-bold text-[var(--foreground)] truncate">{trabalho.aluno.nome}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)]">
                              <User className="w-4 h-4 text-[var(--accent)]" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-widest leading-none mb-1">Orientador</p>
                              <p className="text-sm font-bold text-[var(--foreground)] truncate">
                                {trabalho.orientador.titulacao} {trabalho.orientador.nome}
                              </p>
                            </div>
                          </div>

                          {trabalho.dataDefesa && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[var(--background)] flex items-center justify-center border border-[var(--border)]">
                                <Calendar className="w-4 h-4 text-[var(--muted)]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-widest leading-none mb-1">Data da Defesa</p>
                                <p className="text-sm font-bold text-[var(--foreground)]">
                                  {format(new Date(trabalho.dataDefesa), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          )}

                          {trabalho.banca?.notaFinal && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[var(--success-light)] flex items-center justify-center border border-[var(--success)]/20">
                                <Award className="w-4 h-4 text-[var(--success)]" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-widest leading-none mb-1">Avaliação</p>
                                <p className="text-sm font-black text-[var(--success)]">Nota {trabalho.banca.notaFinal.toFixed(1)}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Palavras-chave */}
                        {trabalho.palavrasChave.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {trabalho.palavrasChave.map((palavra, index) => (
                              <span key={index} className="text-[10px] font-black text-[var(--muted)] bg-[var(--background)] border border-[var(--border)] px-2 py-1 rounded-md uppercase tracking-wider">
                                {palavra}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between items-end border-l border-[var(--border)] pl-8 hidden md:flex min-w-[140px]">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-1">Status</p>
                          <Badge variant="success" className="shadow-sm shadow-emerald-500/10">Defendido</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/trabalhos-publicos/${trabalho.id}`)}
                          className="w-full rounded-xl font-bold group-hover:bg-[var(--primary)] group-hover:text-white transition-all shadow-md group-hover:shadow-[var(--primary)]/20"
                        >
                          Ver Detalhes
                        </Button>
                      </div>

                      <div className="md:hidden pt-4 border-t border-[var(--border)]">
                        <Button
                          variant="gradient"
                          size="lg"
                          onClick={() => router.push(`/trabalhos-publicos/${trabalho.id}`)}
                          className="w-full rounded-2xl font-bold"
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Link para Login */}
          <div className="mt-20 text-center pb-12">
            <div className="inline-flex flex-col items-center">
              <p className="text-sm text-[var(--muted)] font-medium mb-4">Faz parte da instituição?</p>
              <Button 
                variant="outline" 
                onClick={() => router.push("/login")}
                className="rounded-2xl px-12 py-6 h-14 font-black tracking-tight hover:bg-[var(--border-light)] border-2 border-[var(--border)] transition-all"
              >
                Acessar Portal do Aluno/Professor
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
