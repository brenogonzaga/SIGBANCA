"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { LoadingPage } from "../ui/Loading";
import { useToast } from "../ui/Toast";
import { useAuth } from "@/app/contexts/AuthContext";
import { 
  Settings, 
  Clock, 
  FileUp, 
  Mail, 
  Save, 
  RefreshCcw,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

interface ConfiguracaoItem {
  id: string;
  chave: string;
  valor: string;
  descricao: string;
}

export function ConfiguracoesView() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingChave, setSavingChave] = useState<string | null>(null);
  const { token } = useAuth();
  const { showToast } = useToast();

  const fetchConfiguracoes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/configuracoes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setConfiguracoes(data);
      } else {
        showToast("Erro ao carregar configurações", "error");
      }
    } catch (error) {
      showToast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (token) {
      fetchConfiguracoes();
    }
  }, [token, fetchConfiguracoes]);

  const handleUpdate = async (chave: string, novoValor: string) => {
    setSavingChave(chave);
    try {
      const res = await fetch("/api/configuracoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chave, valor: novoValor }),
      });

      if (res.ok) {
        showToast("Configuração atualizada com sucesso", "success");
        // Update local state
        setConfiguracoes(prev => 
          prev.map(c => c.chave === chave ? { ...c, valor: novoValor } : c)
        );
      } else {
        const err = await res.json();
        showToast(err.error || "Erro ao atualizar", "error");
      }
    } catch (error) {
      showToast("Erro de conexão ao salvar", "error");
    } finally {
      setSavingChave(null);
    }
  };

  if (loading) return <LoadingPage message="Carregando configurações do sistema..." />;

  const getConfig = (chave: string) => configuracoes.find(c => c.chave === chave);

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-[40px] p-10 md:p-16 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <Badge variant="default" className="bg-white/20 text-white border-white/30 backdrop-blur-md mb-6 uppercase tracking-[0.2em] font-black text-[10px]">
              Painel Administrativo
            </Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 font-[Plus\ Jakarta\ Sans]">Configurações do Sistema</h1>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed">
              Gerencie parâmetros globais, prazos e preferências de comunicação. Suas alterações impactam o fluxo de trabalho de todos os usuários.
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-2xl h-14 px-8 backdrop-blur-xl"
              onClick={fetchConfiguracoes}
            >
              <RefreshCcw className="w-5 h-5 mr-3" />
              Recarregar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prazos e Agendamentos */}
        <Card className="surface-card overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 opacity-50"></div>
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-black font-[Plus\ Jakarta\ Sans]">Prazos e Agendamentos</CardTitle>
                <p className="text-sm text-[var(--muted)] font-medium">Controle de antecedência e durações padrão</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <ConfigItem 
              label="Antecedência Mínima (Dias)"
              description="Dias mínimos de antecedência para agendar uma banca."
              config={getConfig("prazo_minimo_agendamento")}
              onSave={(val) => handleUpdate("prazo_minimo_agendamento", val)}
              isSaving={savingChave === "prazo_minimo_agendamento"}
              type="number"
            />
            <ConfigItem 
              label="Duração Padrão (Minutos)"
              description="Tempo sugerido para a realização de uma banca."
              config={getConfig("duracao_default_banca")}
              onSave={(val) => handleUpdate("duracao_default_banca", val)}
              isSaving={savingChave === "duracao_default_banca"}
              type="number"
            />
          </CardContent>
        </Card>

        {/* Arquivos e Segurança */}
        <Card className="surface-card overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 opacity-50"></div>
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <FileUp className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-black font-[Plus\ Jakarta\ Sans]">Arquivos e Segurança</CardTitle>
                <p className="text-sm text-[var(--muted)] font-medium">Limites de upload e integridade de dados</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <ConfigItem 
              label="Tamanho Máximo de Arquivo"
              description="Limite de bytes por arquivo (Ex: 10485760 para 10MB)."
              config={getConfig("tamanho_maximo_arquivo")}
              onSave={(val) => handleUpdate("tamanho_maximo_arquivo", val)}
              isSaving={savingChave === "tamanho_maximo_arquivo"}
              type="number"
            />
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-emerald-600 mt-1" />
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                As extensões permitidas (.pdf, .doc, .docx) permanecem fixas no arquivo de configuração estática por motivos de segurança.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Comunicação e Notificações */}
        <Card className="surface-card lg:col-span-2 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)] opacity-50"></div>
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)]/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <CardTitle className="text-xl font-black font-[Plus\ Jakarta\ Sans]">Comunicação e Notificações</CardTitle>
                <p className="text-sm text-[var(--muted)] font-medium">Preferências de envio de mensagens e alertas</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
            <ConfigItemToggle 
              label="Notificações por Email"
              description="Habilita ou desabilita o envio de emails automáticos para alunos e professores."
              config={getConfig("emails_notificacao")}
              onSave={(val) => handleUpdate("emails_notificacao", val)}
              isSaving={savingChave === "emails_notificacao"}
            />
            <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10 flex items-start gap-4 h-fit">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-900 font-bold mb-1">Aviso de Performance</p>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Desabilitar notificações por email pode reduzir o engajamento de professores em processos de revisão e avaliações.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ConfigItemProps {
  label: string;
  description: string;
  config?: ConfiguracaoItem;
  onSave: (val: string) => void;
  isSaving: boolean;
  type?: "text" | "number";
}

function ConfigItem({ label, description, config, onSave, isSaving, type = "text" }: ConfigItemProps) {
  const [value, setValue] = useState(config?.valor || "");

  useEffect(() => {
    if (config) setValue(config.valor);
  }, [config]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="text-sm font-black text-[var(--foreground)] tracking-tight">{label}</label>
          <p className="text-xs text-[var(--muted)] font-medium">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full md:w-32 bg-[var(--surface-light)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm font-black focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 text-center"
          />
          <Button 
            size="sm" 
            variant="gradient"
            className="rounded-xl h-10 w-10 p-0 flex items-center justify-center shadow-lg"
            onClick={() => onSave(value)}
            disabled={isSaving || value === config?.valor}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfigItemToggle({ label, description, config, onSave, isSaving }: Omit<ConfigItemProps, "type">) {
  const isEnabled = config?.valor === "true";

  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <label className="text-sm font-black text-[var(--foreground)] tracking-tight">{label}</label>
        <p className="text-xs text-[var(--muted)] font-medium max-w-sm">{description}</p>
      </div>
      <button 
        onClick={() => onSave(isEnabled ? "false" : "true")}
        disabled={isSaving}
        className={`relative w-14 h-8 rounded-full transition-all duration-500 shadow-inner group ${
          isEnabled ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-gray-300 dark:bg-gray-700"
        }`}
      >
        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-500 transform ${
          isEnabled ? "translate-x-7" : "translate-x-1"
        }`}>
          {isSaving && (
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
