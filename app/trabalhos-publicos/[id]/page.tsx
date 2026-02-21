"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PublicHeader } from "@/app/components/ui/PublicHeader";
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
    <div className="min-h-screen bg-[var(--background)]">
      <PublicHeader title="Portfólio Acadêmico" showBackButton backUrl="/trabalhos-publicos" />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[var(--surface)] border-b border-[var(--border)] pt-16 pb-24">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] bg-[var(--primary)]/5 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[70%] bg-[#7C3AED]/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1]"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="info" className="bg-[var(--primary-light)]/10 text-[var(--primary)] ring-1 ring-[var(--primary-light)] px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {trabalho.curso}
                </Badge>
                {trabalho.banca?.resultado && (
                  <Badge 
                    variant={resultadoConfig[trabalho.banca.resultado]?.variant || "default"}
                    className="px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm"
                  >
                    {resultadoConfig[trabalho.banca.resultado]?.label || trabalho.banca.resultado}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans] leading-[1.1]">
                {trabalho.titulo}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)]/50 flex items-center justify-center shadow-inner">
                    <User className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Autor</p>
                    <p className="font-bold text-[var(--foreground)]">{trabalho.aluno.nome}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)]/50 flex items-center justify-center shadow-inner">
                    <Award className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Orientador</p>
                    <p className="font-bold text-[var(--foreground)]">
                      {trabalho.orientador.titulacao && `${trabalho.orientador.titulacao} `}{trabalho.orientador.nome}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {trabalho.banca?.notaFinal != null && (
              <div className="bg-[var(--surface)]/80 backdrop-blur-xl p-6 rounded-[32px] border border-[var(--border)] shadow-2xl flex flex-col items-center justify-center min-w-[140px] animate-fade-in animate-float">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <span className="text-4xl font-black text-[var(--foreground)] tracking-tighter">
                  {trabalho.banca.notaFinal.toFixed(1)}
                </span>
                <span className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mt-1">Média Final</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Resumo */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-[var(--primary)] rounded-full"></div>
                <h2 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Resumo do Trabalho</h2>
              </div>
              <div className="bg-[var(--surface)] p-8 rounded-[32px] border border-[var(--border)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <p className="text-[var(--muted)] text-lg leading-relaxed relative z-10">
                  {trabalho.descricao}
                </p>
                {trabalho.palavrasChave.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-[var(--border-light)] relative z-10">
                    <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-4">Palavras-chave</p>
                    <div className="flex flex-wrap gap-2">
                      {trabalho.palavrasChave.map((palavra, i) => (
                        <Badge key={i} variant="default" className="bg-[var(--background)] hover:bg-[var(--primary-light)]/20 transition-colors uppercase text-[9px] font-black">
                          {palavra}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Documento Final */}
            {versaoFinal && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-8 bg-[var(--accent)] rounded-full"></div>
                  <h2 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Documento Definitivo</h2>
                </div>
                
                <div className="group relative bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] p-[1px] rounded-[32px] shadow-xl hover:shadow-indigo-500/20 transition-all duration-500">
                  <div className="bg-[var(--surface)] rounded-[31px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                        {versaoFinal.tipoDocumento === "ARQUIVO" ? (
                          <FileText className="w-8 h-8 text-[var(--primary)]" />
                        ) : (
                          <ExternalLink className="w-8 h-8 text-[var(--primary)]" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-[var(--foreground)] mb-1">
                          {versaoFinal.nomeArquivo || versaoFinal.tituloDocumento || "Versão Final"}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-[var(--muted)] font-medium">
                          {versaoFinal.tamanho && (
                            <span className="bg-[var(--background)] px-2 py-0.5 rounded-md border border-[var(--border-light)]">
                              {(versaoFinal.tamanho / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(versaoFinal.dataUpload), "dd MMM, yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="gradient"
                      size="lg"
                      className="px-10 rounded-2xl shadow-lg shadow-indigo-500/20"
                      onClick={() => {
                        if (versaoFinal.tipoDocumento === "ARQUIVO") {
                          window.open(`/api/versoes/${versaoFinal.id}/download`, "_blank");
                        } else if (versaoFinal.urlExterna) {
                          window.open(versaoFinal.urlExterna, "_blank");
                        }
                      }}
                    >
                      {versaoFinal.tipoDocumento === "ARQUIVO" ? (
                        <>
                          <Download className="w-5 h-5 mr-3" />
                          Download PDF
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-5 h-5 mr-3" />
                          Acessar Documento
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Pareceres da Banca */}
            {trabalho.banca && trabalho.banca.membros.some(m => m.avaliacao) && (
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                  <h2 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Avaliações Técnicas</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {trabalho.banca.membros
                    .filter(m => m.avaliacao)
                    .map((membro) => (
                      <div key={membro.id} className="bg-[var(--surface)] p-8 rounded-[32px] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                          <Star className="w-20 h-20" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-black text-indigo-600">
                              {membro.usuario.nome.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--foreground)] text-lg leading-tight">
                                {membro.usuario.titulacao && `${membro.usuario.titulacao} `}{membro.usuario.nome}
                              </p>
                              <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-widest mt-1">
                                {papelLabels[membro.papel] || membro.papel}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-[var(--background)] px-4 py-2 rounded-2xl border border-[var(--border-light)]">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-black text-[var(--foreground)]">{membro.avaliacao!.nota.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-[var(--muted)] leading-relaxed italic relative z-10">
                          "{membro.avaliacao!.parecer}"
                        </p>
                        <div className="mt-4 text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-widest text-right">
                          {format(new Date(membro.avaliacao!.dataAvaliacao), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Informações da Defesa */}
            {trabalho.banca && (
              <div className="bg-[var(--surface)] p-8 rounded-[40px] border border-[var(--border)] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <h3 className="text-xl font-black text-[var(--foreground)] mb-8 font-[Plus\ Jakarta\ Sans] relative z-10">Cronograma</h3>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Data da Defesa</p>
                      <p className="font-bold text-[var(--foreground)]">
                        {format(new Date(trabalho.banca.data), "dd MMMM, yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-[var(--muted)] font-medium">Horário: {trabalho.banca.horario}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Localização</p>
                      <p className="font-bold text-[var(--foreground)]">{trabalho.banca.local}</p>
                      <p className="text-xs text-[var(--muted)] font-medium">{trabalho.banca.modalidade}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-[var(--border-light)] relative z-10">
                  <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-6 text-center">Banca Examinadora</p>
                  <div className="space-y-4">
                    {trabalho.banca.membros.map((membro) => (
                      <div key={membro.id} className="flex flex-col gap-1 p-3 rounded-2xl hover:bg-[var(--background)] transition-colors border border-transparent hover:border-[var(--border-light)]">
                        <span className="text-sm font-bold text-[var(--foreground)] leading-tight">
                          {membro.usuario.titulacao && `${membro.usuario.titulacao} `}{membro.usuario.nome}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                            {papelLabels[membro.papel] || membro.papel}
                          </span>
                          {membro.usuario.lattes && (
                             <a href={membro.usuario.lattes} target="_blank" className="p-1 text-[var(--primary)] hover:bg-[var(--primary-light)]/20 rounded-lg transition-colors">
                               <ExternalLink className="w-3 h-3" />
                             </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CTA Sidebar */}
            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              <h3 className="text-xl font-black mb-4 relative z-10">Interessado?</h3>
              <p className="text-indigo-200 text-sm mb-8 leading-relaxed relative z-10">
                Acesse o sistema completo para gerenciar seus próprios trabalhos ou participar de bancas examinadoras.
              </p>
              <Button 
                variant="gradient" 
                className="w-full py-6 rounded-2xl relative z-10 shadow-lg shadow-indigo-500/10"
                onClick={() => router.push("/login")}
              >
                Acessar Plataforma
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Nav */}
      <footer className="max-w-5xl mx-auto px-6 pb-20 mt-8">
        <div className="pt-12 border-t border-[var(--border-light)] flex flex-col sm:flex-row justify-between items-center gap-6">
          <Button variant="ghost" className="text-[var(--muted)] hover:text-[var(--primary)] font-black uppercase tracking-widest text-[10px]" onClick={() => router.push("/trabalhos-publicos")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Explorar outros trabalhos
          </Button>
          <div className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em]">
            IFAM - Campus Manaus Centro
          </div>
        </div>
      </footer>
    </div>
  );
}
