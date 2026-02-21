"use client";

import React, { useState } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Info
} from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface Banca {
  id: string;
  data: string;
  horario: string;
  local: string;
  status: string;
  trabalho: {
    titulo: string;
    aluno: { nome: string };
  };
}

interface CalendarViewProps {
  bancas: Banca[];
}

export function CalendarView({ bancas }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getBancasForDay = (day: Date) => {
    return bancas.filter(banca => isSameDay(new Date(banca.data), day));
  };

  const statusColors: Record<string, string> = {
    AGENDADA: "bg-blue-500",
    EM_ANDAMENTO: "bg-amber-500",
    REALIZADA: "bg-emerald-500",
    CANCELADA: "bg-red-500",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-[var(--surface)] p-6 rounded-[32px] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)]/20 flex items-center justify-center text-[var(--primary)] shadow-inner">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <p className="text-[var(--muted)] text-sm font-medium">Cronograma Mensal de Defesas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={prevMonth} className="rounded-xl border-[var(--border)]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="md" onClick={() => setCurrentDate(new Date())} className="rounded-xl border-[var(--border)] font-black text-[10px] uppercase tracking-widest px-4">
            Hoje
          </Button>
          <Button variant="outline" size="md" onClick={nextMonth} className="rounded-xl border-[var(--border)]">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="surface-card overflow-hidden border-[var(--border)] shadow-2xl shadow-black/5">
        <div className="grid grid-cols-7 border-b border-[var(--border-light)] bg-[var(--surface-light)]/30">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="py-4 text-center">
              <span className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-[0.2em]">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, idx) => {
            const dayBancas = getBancasForDay(day);
            const isSelectedMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`min-h-[140px] p-2 border-r border-b border-[var(--border-light)] transition-colors relative group/day ${
                  !isSelectedMonth ? "bg-[var(--surface-light)]/20 opacity-40" : "bg-[var(--surface)] hover:bg-[var(--surface-light)]/40"
                } ${idx % 7 === 6 ? "border-r-0" : ""}`}
              >
                <div className="flex justify-between items-start p-2">
                  <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                    isTodayDay 
                      ? "bg-[var(--primary)] text-white shadow-lg shadow-indigo-500/30 scale-110" 
                      : "text-[var(--foreground)] group-hover/day:text-[var(--primary)]"
                  }`}>
                    {format(day, "d")}
                  </span>
                  {dayBancas.length > 0 && (
                    <span className="text-[9px] font-black text-[var(--muted-light)] bg-[var(--surface-light)] px-2 py-0.5 rounded-lg border border-[var(--border-light)]">
                      {dayBancas.length} {dayBancas.length === 1 ? 'Banca' : 'Bancas'}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1 overflow-y-auto max-h-[85px] custom-scrollbar px-1">
                  {dayBancas.map((banca) => (
                    <div
                      key={banca.id}
                      className={`px-2 py-1.5 rounded-lg text-white text-[10px] font-bold truncate cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 ${statusColors[banca.status] || "bg-gray-500"}`}
                      title={`${banca.horario} - ${banca.trabalho.titulo}`}
                    >
                      <span className="w-1 h-1 rounded-full bg-white/50 shrink-0"></span>
                      <span className="opacity-80 font-black">{banca.horario}</span>
                      <span className="truncate">{banca.trabalho.titulo}</span>
                    </div>
                  ))}
                </div>

                {/* Day background indicator for hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)]/5 rounded-full blur-3xl opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 items-center justify-center p-6 bg-[var(--surface-light)]/20 rounded-[32px] border border-dashed border-[var(--border-light)]">
        <p className="text-[10px] font-black text-[var(--muted-light)] uppercase tracking-widest mr-2">Legenda de Status:</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tight">Agendada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tight">Em Andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tight">Realizada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-tight">Cancelada</span>
        </div>
      </div>
    </div>
  );
}
