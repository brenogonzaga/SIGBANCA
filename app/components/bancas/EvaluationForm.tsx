"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  FileText, 
  User as UserIcon,
  MessageSquare,
  Award
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/Toast";
import { submeterAvaliacaoIndividual } from "@/app/actions/avaliacao";

const descricoesCriterios: Record<string, string> = {
  // TCC 1 e comuns
  problema: "Justificativa da escolha, relevância do tema e definição do problema.",
  revisaoFundamentacao: "Fundamentação do tema com fontes, citações e atendimentos às normas da ABNT. Redação com clareza, terminologia técnica, conceitos científicos, ortografia e concordância.",
  revisaoAbordagem: "Abordagem sequencial lógica, equilibrada e ordenada. Revisão com abrangência razoável sobre o problema investigado.",
  propostaSolucao: "Proposta da Solução do Problema Identificado.",
  riscos: "Discussão dos Riscos e Dificuldades.",
  solucaoProposta: "Solução Proposta.",

  // TCC 2
  introducao: "Justificativa da escolha, relevância do tema e definição do problema.",
  objetivos: "Apresentação com coerência e clareza do problema pesquisado.",
  revisao: "Fundamentação do tema com fontes, citações e atendimentos às normas da ABNT. Redação com clareza, terminologia técnica, conceitos científicos, ortografia e concordância.",
  metodologia: "Procedimentos adequados e bem definidos.",
  resultadosApres: "Clareza e objetividade.",
  resultadosDisc: "Confronto dos dados atuais com estudos anteriores contribuindo para a discussão do problema. Conteúdo: significativo, criativo e/ou relevante para área de informática.",
  apresentacao: "Apresentação oral do trabalho (qualidade do material áudio-visual, utilização de linguagem adequada, resposta aos questionamentos da banca).",
  tempo: "Cumprimento do tempo estabelecido.",
  software: "Avaliação da elaboração do projeto, na perspectiva da conformidade com os objetivos do trabalho proposto, considerando se as entregas estão adequadas ao propósito do trabalho."
};

interface Props {
  bancaId: string;
}

export function EvaluationForm({ bancaId }: Props) {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [banca, setBanca] = useState<any>(null);
  const [membro, setMembro] = useState<any>(null);
  const [notaFinal, setNotaFinal] = useState(0);
  const [parecer, setParecer] = useState("");
  const [senhaAssinatura, setSenhaAssinatura] = useState("");
  
  // Notas TCC 2
  const [notas, setNotas] = useState({
    introducao: 0,
    objetivos: 0,
    revisao: 0,
    revisaoAbordagem: 0,
    metodologia: 0,
    resultadosApres: 0,
    resultadosDisc: 0,
    apresentacao: 0,
    tempo: 0,
    software: 0,
  });

  const maxNotas = {
    introducao: 1.0,
    objetivos: 1.0,
    revisao: 1.0,
    revisaoAbordagem: 0.5,
    metodologia: 0.5,
    resultadosApres: 1.0,
    resultadosDisc: 1.0,
    apresentacao: 3.5,
    tempo: 0.5,
    software: 10.0,
  };

  // Notas TCC 1
  const [notasTcc1, setNotasTcc1] = useState({
    problema: 0,
    objetivos: 0,
    revisaoFundamentacao: 0,
    revisaoAbordagem: 0,
    metodologia: 0,
    propostaSolucao: 0,
    riscos: 0,
    solucaoProposta: 0,
    apresentacao: 0,
    tempo: 0,
  });

  const maxNotasTcc1 = {
    problema: 1.0,
    objetivos: 1.0,
    revisaoFundamentacao: 1.0,
    revisaoAbordagem: 0.5,
    metodologia: 0.5,
    propostaSolucao: 1.0,
    riscos: 0.5,
    solucaoProposta: 0.5,
    apresentacao: 3.5,
    tempo: 0.5,
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanca = async () => {
      if (!token) return;
      try {
        const response = await fetch(`/api/bancas/${bancaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setBanca(data);
          
          const membroAtual = data.membros.find((m: any) => m.usuarioId === usuario?.id);
          if (membroAtual) {
            setMembro(membroAtual);
            if (membroAtual.avaliacao) {
              setNotaFinal(membroAtual.avaliacao.nota);
              setParecer(membroAtual.avaliacao.parecer);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar banca:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanca();
  }, [bancaId, token, usuario]);

  const handleNotaChange = (field: string, val: number) => {
    const isTcc1 = banca?.trabalho?.tipo === "TCC1";
    const max = isTcc1 ? maxNotasTcc1[field as keyof typeof maxNotasTcc1] : maxNotas[field as keyof typeof maxNotas];
    let newVal = isNaN(val) ? 0 : val;
    if (newVal > max) newVal = max;
    if (newVal < 0) newVal = 0;

    if (isTcc1) {
      const newNotas = { ...notasTcc1, [field]: newVal };
      setNotasTcc1(newNotas);
      const soma = Object.values(newNotas).reduce((a, b) => a + b, 0);
      setNotaFinal(soma);
    } else {
      const newNotas = { ...notas, [field]: newVal };
      setNotas(newNotas);
      const soma = Object.values(newNotas).reduce((a, b) => a + b, 0);
      setNotaFinal(soma / 2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membro || !usuario || isSubmitting) return;

    if (parecer.length < 20) {
      showToast("O parecer deve ter no mínimo 20 caracteres.", "warning");
      return;
    }

    if (!senhaAssinatura) {
      showToast("A senha de assinatura é obrigatória.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const isTcc1 = banca?.trabalho?.tipo === "TCC1";
      const payload = isTcc1 ? notasTcc1 : notas;
      const result = await submeterAvaliacaoIndividual(bancaId, usuario.id, payload, parecer, senhaAssinatura);

      if (result.success) {
        showToast("Avaliação registrada com sucesso!", "success");
        router.push(`/bancas/${bancaId}`);
      } else {
        showToast(result.error || "Erro ao registrar avaliação.", "error");
      }
    } catch (error) {
      showToast("Erro de conexão com o servidor.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse">Carregando detalhes da comissão...</div>;

  if (!membro) return (
    <div className="py-20 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
      <p className="font-bold text-[var(--muted)]">Você não faz parte desta banca avaliadora.</p>
    </div>
  );

  if (membro.avaliacao) return (
    <div className="py-20 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-[var(--foreground)]">Avaliação Concluída</h3>
        <p className="text-[var(--muted)] font-medium">Você já enviou suas notas para este trabalho.</p>
      </div>
      <button 
        onClick={() => router.back()}
        className="px-8 py-3 bg-[var(--foreground)] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
      >
        Voltar
      </button>
    </div>
  );

  const isTcc1 = banca?.trabalho?.tipo === "TCC1";

  const renderCriterioInput = (field: string, label: string, max: number) => {
    const value = isTcc1 ? notasTcc1[field as keyof typeof notasTcc1] : notas[field as keyof typeof notas];
    const percentage = (value / max) * 100;
    const desc = descricoesCriterios[field];
    
    return (
      <div key={field} className="flex flex-col bg-[var(--surface-light)] p-5 rounded-2xl border border-[var(--border-light)] hover:border-[var(--primary)]/30 transition-all group shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
          <div className="flex flex-col flex-1">
            <label className="text-[11px] font-black text-[var(--foreground)] uppercase tracking-wider">{label}</label>
            {desc && <span className="text-[10px] text-[var(--muted)] font-medium mt-1 normal-case leading-relaxed">{desc}</span>}
          </div>
          <div className="flex items-center gap-1 bg-[var(--background)] px-2 py-1 rounded-lg border border-[var(--border)] self-start md:self-center">
             <input 
                type="number" 
                step="0.05" 
                min="0" 
                max={max} 
                value={value.toFixed(2)} 
                onChange={(e) => handleNotaChange(field, parseFloat(e.target.value))}
                className="w-14 bg-transparent border-none p-1 text-right text-sm font-black text-[var(--primary)] focus:ring-0 outline-none"
             />
             <span className="text-[10px] font-bold text-[var(--muted)] pr-2">/ {max.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="relative group/slider flex items-center h-6">
           <div className="absolute left-0 right-0 h-2 bg-[var(--border)] rounded-full overflow-hidden">
             <div 
               className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] transition-all duration-75"
               style={{ width: `${percentage}%` }}
             ></div>
           </div>
           <input 
             type="range" 
             step="0.05" 
             min="0" 
             max={max} 
             value={value} 
             onChange={(e) => handleNotaChange(field, parseFloat(e.target.value))}
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
             aria-label={`Nota para ${label}`}
             title={value.toFixed(2)}
           />
           <div 
             className="absolute w-5 h-5 bg-white border-2 border-[var(--primary)] rounded-full shadow-md pointer-events-none transition-transform group-hover/slider:scale-125 z-0"
             style={{ left: `calc(${percentage}% - 10px)` }}
           ></div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="surface-card overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] relative">
              <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
            </div>
            <div className="p-8 -mt-12 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6 border-4 border-white">
                <FileText className="w-10 h-10 text-[var(--primary)]" />
              </div>
              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Trabalho Acadêmico - {banca.trabalho.tipo}</p>
              <h3 className="text-lg font-black text-[var(--foreground)] leading-tight mb-4 italic">"{banca.trabalho.titulo}"</h3>
              
              <div className="space-y-4 pt-4 border-t border-[var(--border-light)]">
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-[var(--muted-light)]" />
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-[var(--muted-light)] uppercase tracking-widest">Candidato(a)</p>
                    <p className="text-xs font-bold text-[var(--foreground)]">{banca.trabalho.aluno?.nome || "Discente"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-1 px-2 rounded-lg bg-[var(--surface-light)] border border-[var(--border-light)] text-[9px] font-black text-[var(--muted)] uppercase">
                      {banca.modalidade}
                   </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="surface-card p-8 bg-gradient-to-br from-[var(--background)] to-[var(--surface-light)] border-dashed">
            <h4 className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Award className="w-4 h-4" /> Sua Participação
            </h4>
            <div className="space-y-1">
              <p className="text-sm font-black text-[var(--foreground)]">{usuario?.nome}</p>
              <Badge variant="purple" className="text-[9px] font-black uppercase tracking-widest">
                {membro.papel}
              </Badge>
            </div>
            <p className="text-xs text-[var(--muted)] mt-6 italic leading-relaxed">
              Sua avaliação é confidencial até o registro da ata final pela coordenação.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Card className="surface-card p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Critérios de Avaliação {isTcc1 ? "(TCC 1)" : "(TCC 2)"}</h3>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Nota Final {isTcc1 ? "(Soma)" : "(Soma/2)"}</p>
                <span className="text-4xl font-black text-[var(--primary)] drop-shadow-sm">{notaFinal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-8">
              {isTcc1 ? (
                <>
                  {/* TCC 1 - Trabalho Escrito */}
                  <div>
                    <h4 className="text-sm font-black text-[var(--primary)] uppercase border-b border-[var(--border)] pb-2 mb-4">Trabalho Escrito</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderCriterioInput('problema', '1. Problema de Pesquisa', 1.0)}
                      {renderCriterioInput('objetivos', '2. Definição dos Objetivos', 1.0)}
                      {renderCriterioInput('revisaoFundamentacao', '3.1 Revisão - Fundamentação', 1.0)}
                      {renderCriterioInput('revisaoAbordagem', '3.2 Revisão - Abordagem', 0.5)}
                      {renderCriterioInput('metodologia', '4. Orientação Metodológica', 0.5)}
                      {renderCriterioInput('propostaSolucao', '5. Proposta da Solução', 1.0)}
                      {renderCriterioInput('riscos', '6. Riscos e Dificuldades', 0.5)}
                      {renderCriterioInput('solucaoProposta', '7. Solução Proposta', 0.5)}
                    </div>
                  </div>
                  {/* TCC 1 - Apresentação Oral */}
                  <div>
                    <h4 className="text-sm font-black text-[var(--primary)] uppercase border-b border-[var(--border)] pb-2 mb-4">Apresentação Oral</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderCriterioInput('apresentacao', '8. Apresentação Oral', 3.5)}
                      {renderCriterioInput('tempo', 'Cumprimento do Tempo', 0.5)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* TCC 2 - Trabalho Escrito */}
                  <div>
                    <h4 className="text-sm font-black text-[var(--primary)] uppercase border-b border-[var(--border)] pb-2 mb-4">Trabalho Escrito</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderCriterioInput('introducao', '1. Introdução', 1.0)}
                      {renderCriterioInput('objetivos', '2. Definição dos Objetivos', 1.0)}
                      {renderCriterioInput('revisao', '3. Revisão Bibliográfica', 1.0)}
                      {renderCriterioInput('revisaoAbordagem', 'Abordagem Sequencial', 0.5)}
                      {renderCriterioInput('metodologia', '4. Orientação Metodológica', 0.5)}
                      {renderCriterioInput('resultadosApres', '5. Apresentação dos Resultados', 1.0)}
                      {renderCriterioInput('resultadosDisc', '6. Discussão dos Resultados', 1.0)}
                    </div>
                  </div>

                  {/* TCC 2 - Apresentação Oral */}
                  <div>
                    <h4 className="text-sm font-black text-[var(--primary)] uppercase border-b border-[var(--border)] pb-2 mb-4">Apresentação Oral</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderCriterioInput('apresentacao', '7. Apresentação Oral', 3.5)}
                      {renderCriterioInput('tempo', 'Cumprimento do Tempo', 0.5)}
                    </div>
                  </div>

                  {/* TCC 2 - Implementação do Software */}
                  <div>
                    <h4 className="text-sm font-black text-[var(--primary)] uppercase border-b border-[var(--border)] pb-2 mb-4">Implementação do Software</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {renderCriterioInput('software', '8. Implementação do TCC', 10.0)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="surface-card p-10">
            <div className="flex items-center gap-3 mb-6">
               <MessageSquare className="w-5 h-5 text-[var(--muted-light)]" />
               <h3 className="text-xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Parecer Acadêmico</h3>
            </div>
            <textarea 
              required
              placeholder="Descreva detalhadamente seus comentários, sugestões e justificativa para as notas atribuídas..."
              className="w-full min-h-[200px] p-6 bg-[var(--background)] border border-[var(--border)] rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all custom-scrollbar outline-none"
              value={parecer}
              onChange={(e) => setParecer(e.target.value)}
            />
            <div className="mt-8 border-t border-[var(--border)] pt-8">
               <h4 className="text-sm font-black text-[var(--foreground)] mb-4 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Assinatura Eletrônica
               </h4>
               <p className="text-xs text-[var(--muted)] mb-4">
                 Para concluir a avaliação, digite sua senha de acesso. Ela servirá como sua assinatura eletrônica no documento PDF gerado.
               </p>
               <input 
                 type="password"
                 required
                 placeholder="Sua senha de acesso"
                 className="w-full md:w-1/2 p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                 value={senhaAssinatura}
                 onChange={(e) => setSenhaAssinatura(e.target.value)}
               />
            </div>

            <div className="flex justify-between items-center mt-6">
               <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                 Mínimo de 20 caracteres • Atualmente: {parecer.length}
               </p>
               <button 
                 type="submit"
                 disabled={isSubmitting || !senhaAssinatura}
                 className="flex items-center gap-3 px-10 py-4 bg-[var(--foreground)] text-white font-black text-xs uppercase tracking-[0.2em] rounded-[20px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 disabled:opacity-50"
               >
                 {isSubmitting ? "Processando..." : (
                   <>
                    <Save className="w-4 h-4" /> Assinar e Enviar Avaliação
                   </>
                 )}
               </button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
