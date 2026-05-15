"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface ProtocoloFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ProtocoloForm({ onClose, onSuccess }: ProtocoloFormProps) {
  const { token, usuario } = useAuth();
  const [trabalhos, setTrabalhos] = useState<any[]>([]);
  const [isLoadingTrabalhos, setIsLoadingTrabalhos] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo: "FICHA_CATALOGRAFICA",
    trabalhoId: "",
    observacoes: "",
    arquivo: null as File | null
  });

  useEffect(() => {
    async function fetchTrabalhos() {
      if (!token) return;
      try {
        const res = await fetch("/api/trabalhos", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Apenas trabalhos do aluno logado
          setTrabalhos(data.filter((t: any) => t.alunoId === usuario?.id));
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, trabalhoId: data[0].id }));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingTrabalhos(false);
      }
    }
    fetchTrabalhos();
  }, [token, usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trabalhoId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("tipo", formData.tipo);
      data.append("trabalhoId", formData.trabalhoId);
      data.append("observacoes", formData.observacoes);
      if (formData.arquivo) {
        data.append("arquivo", formData.arquivo);
      }

      const response = await fetch("/api/protocolos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Erro ao abrir protocolo.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro na requisição.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-lg overflow-hidden relative shadow-2xl border-[var(--border-light)] animate-scale-in">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] to-[#7C3AED]"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight uppercase italic">Nova Solicitação</h2>
              <p className="text-xs font-bold text-[var(--muted-light)] uppercase tracking-widest mt-1">Protocolo Acadêmico</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-light)] transition-colors text-[var(--muted)]">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Tipo de Documento</label>
              <select
                className="w-full bg-[var(--surface-light)]/50 border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] transition-all outline-none"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...prev => ({ ...prev, tipo: e.target.value }) })}
              >
                <option value="FICHA_CATALOGRAFICA">Ficha Catalográfica (TCC Final)</option>
                <option value="NADA_CONSTA">Certidão de Nada Consta (Biblioteca)</option>
                <option value="ENTREGA_VERSAO_FINAL">Depósito de Versão Final (Repositório)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Vincular ao Trabalho</label>
              {isLoadingTrabalhos ? (
                <div className="h-12 bg-[var(--surface-light)] rounded-xl animate-pulse"></div>
              ) : (
                <select
                  className="w-full bg-[var(--surface-light)]/50 border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] transition-all outline-none"
                  value={formData.trabalhoId}
                  onChange={(e) => setFormData({ ...prev => ({ ...prev, trabalhoId: e.target.value }) })}
                >
                  {trabalhos.map(t => (
                    <option key={t.id} value={t.id}>{t.titulo}</option>
                  ))}
                  {trabalhos.length === 0 && <option value="">Nenhum trabalho encontrado</option>}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Anexo (PDF)</label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({ ...prev => ({ ...prev, arquivo: e.target.files?.[0] || null }) })}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-light)] rounded-2xl cursor-pointer bg-[var(--surface-light)]/30 hover:bg-white dark:hover:bg-gray-800 hover:border-[var(--primary)] transition-all group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className={`w-8 h-8 mb-2 transition-transform group-hover:-translate-y-1 ${formData.arquivo ? 'text-emerald-500' : 'text-[var(--muted-light)]'}`} />
                    <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-tight">
                      {formData.arquivo ? formData.arquivo.name : "Clique para selecionar o PDF"}
                    </p>
                  </div>
                </label>
              </div>
              <p className="text-[9px] font-bold text-[var(--muted-light)] uppercase ml-1 italic">
                * Para ficha catalográfica, envie a versão final corrigida.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Informações Adicionais</label>
              <textarea
                className="w-full bg-[var(--surface-light)]/50 border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] transition-all outline-none h-24 resize-none"
                placeholder="Ex: Urgência para colação de grau, correções específicas, etc."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...prev => ({ ...prev, observacoes: e.target.value }) })}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-black uppercase tracking-widest border-[var(--border)]">
                Cancelar
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting || !formData.trabalhoId} className="flex-2 rounded-xl h-12 font-black uppercase tracking-[0.2em] shadow-lg shadow-[var(--primary)]/20">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Abrir Protocolo"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
