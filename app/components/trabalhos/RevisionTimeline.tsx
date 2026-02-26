"use client";

import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle2, 
  Clock, 
  FileEdit, 
  Send, 
  Users, 
  AlertCircle, 
  Flag,
  CornerDownRight
} from "lucide-react";
import { Badge } from "../ui/Badge";

interface TimelineEvent {
  id: string;
  type: "CREATED" | "UPLOAD" | "STATUS_CHANGE" | "BANCA" | "FINAL";
  title: string;
  description?: string;
  date: Date;
  status?: string;
  isCompleted: boolean;
  isCurrent?: boolean;
}

interface RevisionTimelineProps {
  trabalho: any;
  versoes: any[];
}

export function RevisionTimeline({ trabalho, versoes }: RevisionTimelineProps) {
  const events: TimelineEvent[] = [];

  // 1. Creation
  events.push({
    id: "creation",
    type: "CREATED",
    title: "Trabalho Criado",
    description: "Início do processo acadêmico.",
    date: new Date(trabalho.dataCriacao || trabalho.dataInicio || new Date()),
    isCompleted: true,
  });

  // 2. Versions and progress
  const sortedVersoes = [...versoes].sort((a, b) => 
    new Date(a.dataUpload).getTime() - new Date(b.dataUpload).getTime()
  );

  sortedVersoes.forEach((versao, index) => {
    events.push({
      id: `versao-${versao.id}`,
      type: "UPLOAD",
      title: `Versão ${versao.numeroVersao} Enviada`,
      description: versao.changelog || "Sem descrição de alterações.",
      date: new Date(versao.dataUpload),
      isCompleted: true,
    });

    // Check if this version preceded a revision request
    if (trabalho.status === "EM_REVISAO" && index === sortedVersoes.length - 1) {
      events.push({
        id: "status-revisao",
        type: "STATUS_CHANGE",
        title: "Ajustes Solicitados",
        description: "O orientador solicitou revisões no documento.",
        date: new Date(trabalho.updatedAt),
        isCompleted: true,
        isCurrent: true,
        status: "EM_REVISAO"
      });
    }
  });

  // 3. Approval by Orientador
  if (["APROVADO_ORIENTADOR", "AGUARDANDO_BANCA", "BANCA_AGENDADA", "APROVADO", "REPROVADO"].includes(trabalho.status)) {
    events.push({
      id: "approval-orientador",
      type: "STATUS_CHANGE",
      title: "Aprovado pelo Orientador",
      description: "Trabalho pronto para defesa acadêmica.",
      date: new Date(trabalho.updatedAt || new Date()),
      isCompleted: true,
    });
  }

  // 4. Banca
  if (trabalho.banca) {
    events.push({
      id: "banca-agendada",
      type: "BANCA",
      title: "Banca Agendada",
      description: `Defesa agendada para: ${trabalho.banca.local}.`,
      date: new Date(trabalho.banca.data),
      isCompleted: trabalho.banca.status === "REALIZADA",
      isCurrent: trabalho.banca.status === "AGENDADA",
    });
  }

  // 5. Final Result
  if (trabalho.status === "APROVADO") {
    events.push({
      id: "final-result",
      type: "FINAL",
      title: "Trabalho Aprovado",
      description: `Parabéns! O processo acadêmico foi concluído com sucesso.`,
      date: new Date(trabalho.updatedAt || new Date()),
      isCompleted: true,
      isCurrent: true,
    });
  } else if (trabalho.status === "REPROVADO") {
    events.push({
      id: "final-result",
      type: "FINAL",
      title: "Trabalho Reprovado",
      description: "Não atingiu os critérios para aprovação nesta instância.",
      date: new Date(trabalho.updatedAt || new Date()),
      isCompleted: true,
      isCurrent: true,
    });
  }

  // Sort events by date to ensure chronological order
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="relative py-8">
      {/* Central Line (Desktop) */}
      <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--primary)] via-[var(--primary-light)] to-transparent opacity-20 hidden md:block"></div>

      <div className="space-y-12">
        {events.map((event, index) => {
          const Icon = getIcon(event.type);
          const isLatest = index === events.length - 1;

          return (
            <div key={event.id} className="relative flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 group">
              {/* Dot / Icon Container */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-700 shadow-xl ${
                  event.isCurrent 
                    ? "bg-gradient-to-br from-[var(--primary)] to-[#7C3AED] text-white scale-110 ring-8 ring-[var(--primary-light)]/20" 
                    : event.isCompleted
                    ? "bg-white dark:bg-[var(--surface)] text-[var(--primary)] border-2 border-[var(--primary-light)]"
                    : "bg-[var(--surface-light)] text-[var(--muted)] border-2 border-[var(--border)]"
                }`}>
                  <Icon className={`w-6 h-6 ${event.isCurrent ? "animate-pulse" : ""}`} />
                </div>
                {!isLatest && (
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-[var(--primary-light)] to-transparent opacity-20 md:hidden"></div>
                )}
              </div>

              {/* Content Card */}
              <div className={`flex-1 w-full p-6 md:p-0 rounded-[28px] md:bg-transparent md:border-0 border border-[var(--border-light)] bg-[var(--surface-light)]/10 transition-all duration-500 ${event.isCurrent ? "opacity-100 scale-[1.02] md:scale-100" : "opacity-80 group-hover:opacity-100"}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <h4 className={`text-xl font-black tracking-tight ${event.isCurrent ? "text-[var(--foreground)]" : "text-[var(--foreground)] opacity-90"}`}>
                    {event.title}
                  </h4>
                  <span className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em] bg-white dark:bg-[var(--surface)] px-4 py-1.5 rounded-xl border border-[var(--border-light)] shadow-sm whitespace-nowrap self-start">
                    {format(event.date, "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                
                {event.description && (
                  <p className="text-sm text-[var(--muted)] font-medium leading-relaxed max-w-2xl bg-[var(--surface)]/30 p-4 rounded-2xl border border-[var(--border-light)]/50 italic">
                    "{event.description}"
                  </p>
                )}

                {event.status && (
                  <div className="mt-4">
                    <Badge variant={event.status === "EM_REVISAO" ? "danger" : "default"} className="font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1">
                      {event.status.replace("_", " ")}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getIcon(type: string) {
  switch (type) {
    case "CREATED": return Flag;
    case "UPLOAD": return Send;
    case "STATUS_CHANGE": return FileEdit;
    case "BANCA": return Users;
    case "FINAL": return CheckCircle2;
    default: return Clock;
  }
}
