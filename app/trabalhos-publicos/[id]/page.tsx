"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PublicHeader } from "@/app/components/ui/PublicHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  User,
  BookOpen,
  Calendar,
  MapPin,
  Award,
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type PlataformaExterna = "google_docs" | "google_drive" | "onedrive" | "dropbox" | "overleaf" | "notion" | "outro";

interface TrabalhoDetalhePublico {
  id: string;
  titulo: string;
  descricao: string;
  palavrasChave: string[];
  curso: string;
  dataDefesa?: string;
  aluno: {
    id: string;
    nome: string;
    curso?: string;
    matricula?: string;
  };
  orientador: {
    id: string;
    nome: string;
    titulacao?: string;
    departamento?: string;
    lattes?: string;
  };
  versoes: Array<{
    id: string;
    numeroVersao: number;
    nomeArquivo?: string;
    tipoDocumento: string;
    urlExterna?: string;
    plataforma?: PlataformaExterna;
    tituloDocumento?: string;
    tamanho?: number;
    dataUpload: string;
  }>;
  banca?: {
    id: string;
    data: string;
    horario: string;
    local: string;
    modalidade: string;
    notaFinal?: number;
    resultado?: string;
    membros: Array<{
      id: string;
      papel: string;
      usuario: {
        id: string;
        nome: string;
        titulacao?: string;
        departamento?: string;
        lattes?: string;
      };
      avaliacao?: {
        parecer: string;
        nota: number;
        dataAvaliacao: string;
      };
    }>;
  };
}

const plataformaLabels: Record<string, string> = {
  google_docs: "Google Docs",
  google_drive: "Google Drive",
  onedrive: "OneDrive",
  dropbox: "Dropbox",
  overleaf: "Overleaf",
  notion: "Notion",
  outro: "Link Externo",
};

const papelLabels: Record<string, string> = {
  ORIENTADOR: "Orientador",
  AVALIADOR: "Avaliador",
  SUPLENTE: "Suplente",
};

export default function TrabalhoPublicoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trabalho, setTrabalho] = useState<TrabalhoDetalhePublico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchTrabalho() {
      try {
        const response = await fetch(`/api/trabalhos/publicos/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setTrabalho(data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Erro ao carregar trabalho:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) fetchTrabalho();
  }, [params.id]);

  if (isLoading) {
    return (
      <>
        <PublicHeader title="Detalhes do Trabalho" showBackButton backUrl="/trabalhos-publicos" />
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </>
    );
  }

  if (notFound || !trabalho) {
    return (
      <>
        <PublicHeader title="Trabalho não encontrado" showBackButton backUrl="/trabalhos-publicos" />
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center space-y-4">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto" />
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Trabalho não encontrado
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Este trabalho não está disponível publicamente ou não existe.
            </p>
            <Button variant="secondary" onClick={() => router.push("/trabalhos-publicos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à lista
            </Button>
          </div>
        </div>
      </>
    );
  }

  const versaoFinal = trabalho.versoes[0];
  const resultadoConfig: Record<string, { label: string; variant: "success" | "danger" | "warning" }> = {
    APROVADO: { label: "Aprovado", variant: "success" },
    REPROVADO: { label: "Reprovado", variant: "danger" },
    APROVADO_COM_RESSALVAS: { label: "Aprovado com Ressalvas", variant: "warning" },
  };

  return (
    <>
      <PublicHeader title="Detalhes do Trabalho" showBackButton backUrl="/trabalhos-publicos" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        {/* Banner do título */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-wrap items-start gap-4 justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {trabalho.titulo}
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="info">{trabalho.curso}</Badge>
                  {trabalho.banca?.resultado && (
                    <Badge variant={resultadoConfig[trabalho.banca.resultado]?.variant || "default"}>
                      {resultadoConfig[trabalho.banca.resultado]?.label || trabalho.banca.resultado}
                    </Badge>
                  )}
                </div>
              </div>
              {trabalho.banca?.notaFinal != null && (
                <div className="flex flex-col items-center justify-center w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-200 dark:border-blue-700">
                  <Star className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
                  <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {trabalho.banca.notaFinal.toFixed(1)}
                  </span>
                  <span className="text-xs text-blue-500 dark:text-blue-400">nota</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

          {/* Equipe */}
          <Card>
            <CardHeader>
              <CardTitle>Equipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aluno */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Autor</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{trabalho.aluno.nome}</p>
                  {trabalho.aluno.curso && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{trabalho.aluno.curso}</p>
                  )}
                  {trabalho.aluno.matricula && (
                    <p className="text-sm text-gray-500 dark:text-gray-500">Matrícula: {trabalho.aluno.matricula}</p>
                  )}
                </div>
              </div>

              {/* Orientador */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Orientador</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {trabalho.orientador.titulacao && `${trabalho.orientador.titulacao} `}{trabalho.orientador.nome}
                  </p>
                  {trabalho.orientador.departamento && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{trabalho.orientador.departamento}</p>
                  )}
                  {trabalho.orientador.lattes && (
                    <a
                      href={trabalho.orientador.lattes}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Currículo Lattes
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Defesa */}
          {trabalho.banca && (
            <Card>
              <CardHeader>
                <CardTitle>Defesa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(trabalho.banca.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {" às "}{trabalho.banca.horario}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{trabalho.banca.local}</span>
                  </div>
                </div>

                {/* Membros da banca */}
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Banca Avaliadora</p>
                  <div className="space-y-2">
                    {trabalho.banca.membros.map((membro) => (
                      <div
                        key={membro.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {membro.usuario.titulacao && `${membro.usuario.titulacao} `}{membro.usuario.nome}
                          </span>
                          {membro.usuario.departamento && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{membro.usuario.departamento}</p>
                          )}
                        </div>
                        <Badge variant="default">{papelLabels[membro.papel] || membro.papel}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{trabalho.descricao}</p>
              {trabalho.palavrasChave.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Palavras-chave</p>
                  <div className="flex flex-wrap gap-2">
                    {trabalho.palavrasChave.map((palavra, i) => (
                      <Badge key={i} variant="default">{palavra}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documento Final */}
          {versaoFinal && (
            <Card>
              <CardHeader>
                <CardTitle>Documento Final</CardTitle>
              </CardHeader>
              <CardContent>
                {versaoFinal.tipoDocumento === "ARQUIVO" ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {versaoFinal.nomeArquivo || "Documento final"}
                        </p>
                        {versaoFinal.tamanho && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {(versaoFinal.tamanho / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => window.open(`/api/versoes/${versaoFinal.id}/download`, "_blank")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {versaoFinal.tituloDocumento || "Documento externo"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {plataformaLabels[versaoFinal.plataforma || ""] || versaoFinal.plataforma}
                        </p>
                      </div>
                    </div>
                    {versaoFinal.urlExterna && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => window.open(versaoFinal.urlExterna!, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Acessar
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pareceres da Banca */}
          {trabalho.banca && trabalho.banca.membros.some(m => m.avaliacao) && (
            <Card>
              <CardHeader>
                <CardTitle>Pareceres da Banca</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trabalho.banca.membros
                  .filter(m => m.avaliacao)
                  .map((membro) => (
                    <div
                      key={membro.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {membro.usuario.titulacao && `${membro.usuario.titulacao} `}{membro.usuario.nome}
                        </p>
                        <Badge variant="default">{papelLabels[membro.papel] || membro.papel}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {membro.avaliacao!.parecer}
                      </p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Rodapé de navegação */}
          <div className="flex justify-between items-center pt-4">
            <Button variant="secondary" onClick={() => router.push("/trabalhos-publicos")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar à lista
            </Button>
            <Button variant="secondary" onClick={() => router.push("/login")}>
              Acessar Sistema Completo
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
