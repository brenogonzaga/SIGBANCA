"use client";

import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { 
  X, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  FileText,
  AlertTriangle
} from "lucide-react";

interface ProtocoloProcessModalProps {
  protocolo: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProtocoloProcessModal({ protocolo, onClose, onSuccess }: ProtocoloProcessModalProps) {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    status: protocolo.status === "ABERTO" ? "EM_PROCESSAMENTO" : protocolo.status,
    observacoes: protocolo.observacoes || "",
    arquivoRetorno: null as File | null,
    arquivoRetornoUrl: protocolo.arquivoRetornoUrl || ""
  });

  const [autoGenData, setAutoGenData] = useState({
    cutter: "",
    cdd: "",
    bibliotecario: "",
    crb: ""
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateFicha = async () => {
    if (!autoGenData.cutter || !autoGenData.cdd) {
      alert("Por favor, preencha o Código Cutter e o CDD.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/protocolos/${protocolo.id}/gerar-ficha`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(autoGenData)
      });

      if (response.ok) {
        const { url } = await response.json();
        setFormData(prev => ({ ...prev, arquivoRetornoUrl: url, status: "DEFERIDO" }));
        alert("Ficha Catalográfica gerada com sucesso!");
      } else {
        alert("Erro ao gerar ficha.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("status", formData.status);
      data.append("observacoes", formData.observacoes);

      if (formData.arquivoRetorno) {
        data.append("arquivoRetorno", formData.arquivoRetorno);
      }
      
      if (formData.arquivoRetornoUrl) {
        data.append("arquivoRetornoUrl", formData.arquivoRetornoUrl);
      }

      const response = await fetch(`/api/protocolos/${protocolo.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Erro ao processar: ${errorData.error || "Erro desconhecido"}`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erro na requisição: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <Card className="w-full max-w-xl overflow-hidden relative shadow-2xl border-[var(--border-light)] animate-scale-in">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight uppercase">Processar Solicitação</h2>
              <p className="text-xs font-bold text-[var(--muted-light)] uppercase tracking-widest mt-1">
                Protocolo #{protocolo.id.slice(-6).toUpperCase()} - {protocolo.aluno.nome}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--surface-light)] transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações do Pedido */}
            <div className="p-4 rounded-2xl bg-[var(--surface-light)]/50 border border-[var(--border-light)] space-y-2">
               <p className="text-[10px] font-black text-[var(--muted-light)] uppercase">Tipo de Solicitação:</p>
               <p className="text-sm font-bold text-[var(--foreground)]">{protocolo.tipo.replace(/_/g, " ")}</p>
               {protocolo.arquivoEnviadoUrl && (
                 <a href={protocolo.arquivoEnviadoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-[var(--primary)] hover:underline mt-2">
                   <FileText className="w-4 h-4" />
                   VER DOCUMENTO ENVIADO PELO ALUNO
                 </a>
               )}
            </div>

            {/* Novo Status */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Atualizar Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "EM_PROCESSAMENTO", label: "Em Análise", color: "text-amber-500", bg: "bg-amber-500/10" },
                  { id: "DEFERIDO", label: "Deferido", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { id: "INDEFERIDO", label: "Indeferido", color: "text-red-500", bg: "bg-red-500/10" },
                  { id: "CANCELADO", label: "Cancelado", color: "text-gray-500", bg: "bg-gray-500/10" }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: s.id })}
                    className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center gap-1 ${
                      formData.status === s.id 
                        ? `border-current shadow-sm ${s.bg} ${s.color}` 
                        : "border-[var(--border-light)] text-[var(--muted)] hover:bg-[var(--surface-light)]"
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-tighter leading-tight">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seção de Geração Automática para Ficha Catalográfica */}
            {protocolo.tipo === "FICHA_CATALOGRAFICA" && (
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                   <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest">Ferramenta de Geração Automática</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-indigo-600 uppercase">Cutter (ex: S729m)</label>
                      <input 
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs"
                        value={autoGenData.cutter}
                        onChange={(e) => setAutoGenData({...autoGenData, cutter: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-indigo-600 uppercase">CDD (ex: 005.3)</label>
                      <input 
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs"
                        value={autoGenData.cdd}
                        onChange={(e) => setAutoGenData({...autoGenData, cdd: e.target.value})}
                      />
                   </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-indigo-500 text-indigo-600 hover:bg-indigo-500 hover:text-white"
                  onClick={handleGenerateFicha}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                  {formData.arquivoRetornoUrl ? "Regerar Ficha Catalográfica" : "Gerar Ficha Automaticamente"}
                </Button>

                {formData.arquivoRetornoUrl && (
                  <p className="text-[10px] font-bold text-emerald-600 italic flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ficha gerada! Clique em Salvar para enviar ao aluno.
                  </p>
                )}
              </div>
            )}

            {/* Upload de Retorno (Ficha, etc.) */}
            {(formData.status === "DEFERIDO") && (
              <div className="space-y-2 animate-slide-in-down">
                <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Anexar Resultado (PDF)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({ ...formData, arquivoRetorno: e.target.files?.[0] || null })}
                    className="hidden"
                    id="file-return"
                  />
                  <label
                    htmlFor="file-return"
                    className="flex items-center gap-4 w-full p-4 border-2 border-dashed border-[var(--border-light)] rounded-2xl cursor-pointer bg-white dark:bg-gray-800 hover:border-indigo-500 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-[var(--foreground)] uppercase">
                        {formData.arquivoRetorno ? formData.arquivoRetorno.name : "Selecionar Ficha Catalográfica / Nada Consta"}
                      </p>
                      <p className="text-[9px] font-bold text-[var(--muted-light)]">Clique para fazer upload do documento final</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Observações / Parecer */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest ml-1">Observações / Parecer Técnico</label>
              <textarea
                className="w-full bg-[var(--surface-light)]/50 border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm font-medium text-[var(--foreground)] focus:ring-2 focus:ring-blue-500 transition-all outline-none h-24 resize-none"
                placeholder="Informe o motivo do indeferimento ou instruções adicionais para o aluno..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>

            {/* Alertas */}
            {formData.status === "INDEFERIDO" && !formData.observacoes && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase">É obrigatório informar o motivo do indeferimento.</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-black uppercase tracking-widest border-[var(--border)]">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="gradient" 
                disabled={isSubmitting || (formData.status === "INDEFERIDO" && !formData.observacoes)} 
                className="flex-1 rounded-xl h-12 font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
