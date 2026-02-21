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

interface Props {
  bancaId: string;
}

interface Criterio {
  nome: string;
  descricao: string;
  nota: number;
  peso: number;
}

export function EvaluationForm({ bancaId }: Props) {
  const { token, usuario } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [banca, setBanca] = useState<any>(null);
  const [membro, setMembro] = useState<any>(null);
  const [notaFinal, setNotaFinal] = useState(0);
  const [parecer, setParecer] = useState("");
  const [criterios, setCriterios] = useState<Criterio[]>([
    { nome: "Qualidade Técnica", descricao: "Profundidade e rigor acadêmico do trabalho.", nota: 0, peso: 0.3 },
    { nome: "Apresentação", descricao: "Clareza, postura e domínio de conteúdo durante a defesa.", nota: 0, peso: 0.2 },
    { nome: "Metodologia", descricao: "Adequação dos métodos científicos aplicados.", nota: 0, peso: 0.2 },
    { nome: "Resultados", descricao: "Contribuição efetiva e relevância dos resultados obtidos.", nota: 0, peso: 0.3 },
  ]);
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
          
          // Encontrar o registro de membro para o usuário atual
          const membroAtual = data.membros.find((m: any) => m.usuarioId === usuario?.id);
          if (membroAtual) {
            setMembro(membroAtual);
            if (membroAtual.avaliacao) {
              setNotaFinal(membroAtual.avaliacao.nota);
              setParecer(membroAtual.avaliacao.parecer);
              // Se já avaliou, redirecionar ou mostrar mensagem (neste caso vamos só preencher se permitirmos editar, mas a API bloqueia re-avaliação)
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

  const handleNotaChange = (idx: number, val: number) => {
    const newCriterios = [...criterios];
    newCriterios[idx].nota = val;
    setCriterios(newCriterios);
    
    // Calcular nota final ponderada
    const total = newCriterios.reduce((acc, c) => acc + (c.nota * c.peso), 0);
    setNotaFinal(Math.min(10, Math.max(0, parseFloat(total.toFixed(1)))));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membro || isSubmitting) return;

    if (parecer.length < 20) {
      showToast("O parecer deve ter no mínimo 20 caracteres.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          membroId: membro.id,
          nota: notaFinal,
          parecer,
          criterios
        })
      });

      if (response.ok) {
        showToast("Avaliação registrada com sucesso!", "success");
        router.push(`/trabalhos/${banca.trabalhoId}`);
      } else {
        const err = await response.json();
        showToast(err.error || "Erro ao registrar avaliação.", "error");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-fade-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Trabalho & Banca Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="surface-card overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] relative">
              <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
            </div>
            <div className="p-8 -mt-12 relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6 border-4 border-white">
                <FileText className="w-10 h-10 text-[var(--primary)]" />
              </div>
              <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mb-1">Trabalho Acadêmico</p>
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
                   <div className="p-1 px-2 rounded-lg bg-[var(--surface-light)] border border-[var(--border-light)] text-[9px] font-black text-[var(--muted)] uppercase">
                      Banca Individual
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

        {/* Main Content: Criteria & Feedback */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="surface-card p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Critérios de Avaliação</h3>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">Nota Final Calculada</p>
                <span className="text-4xl font-black text-[var(--primary)] drop-shadow-sm">{notaFinal.toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-10">
              {criterios.map((c, idx) => (
                <div key={idx} className="space-y-4 group">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                        <h4 className="text-sm font-black text-[var(--foreground)] uppercase tracking-tight">{c.nome}</h4>
                        <span className="text-[9px] font-black text-[var(--muted-light)] uppercase">Peso {(c.peso * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-[var(--muted)] leading-relaxed italic pr-8">{c.descricao}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xl font-black text-[var(--foreground)] w-8 text-right">{c.nota.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="relative pt-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      step="0.5" 
                      value={c.nota}
                      onChange={(e) => handleNotaChange(idx, parseFloat(e.target.value))}
                      className="w-full h-2 bg-[var(--surface-light)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)] hover:accent-[var(--primary-light)] transition-all"
                    />
                    <div className="flex justify-between px-1 mt-2">
                      <span className="text-[8px] font-black text-[var(--muted-light)]">0.0</span>
                      <span className="text-[8px] font-black text-[var(--muted-light)]">10.0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="surface-card p-10">
            <div className="flex items-center gap-3 mb-6">
               <MessageSquare className="w-5 h-5 text-[var(--muted-light)]" />
               <h3 className="text-xl font-black text-[var(--foreground)] font-[Plus\ Jakarta\ Sans]">Parecer Acadêmico</h3>
            </div>
            <textarea 
              required
              placeholder="Descreva detalhadamente seus comentários, sugestões e justificativa para a nota atribuída..."
              className="w-full min-h-[200px] p-6 bg-[var(--background)] border border-[var(--border)] rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 transition-all custom-scrollbar outline-none"
              value={parecer}
              onChange={(e) => setParecer(e.target.value)}
            />
            <div className="flex justify-between items-center mt-6">
               <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest">
                 Mínimo de 20 caracteres • Atualmente: {parecer.length}
               </p>
               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="flex items-center gap-3 px-10 py-4 bg-[var(--foreground)] text-white font-black text-xs uppercase tracking-[0.2em] rounded-[20px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 disabled:opacity-50"
               >
                 {isSubmitting ? "Processando..." : (
                   <>
                    <Save className="w-4 h-4" /> Enviar Avaliação Final
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
