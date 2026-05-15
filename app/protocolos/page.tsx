"use client";

import { useState } from "react";
import { Navigation } from "../components/layout/Navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import { ProtocoloList } from "../components/protocolos/ProtocoloList";
import { ProtocoloForm } from "../components/protocolos/ProtocoloForm";
import { useRouter } from "next/navigation";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { Plus, ClipboardList, Info } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function ProtocolosPage() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="protocolos" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-light)] p-8 rounded-3xl border border-[var(--border-light)] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)] opacity-[0.03] rounded-full -mr-32 -mt-32"></div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <ClipboardList className="w-8 h-8 text-[var(--primary)]" />
                    <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tighter uppercase italic">
                      Protocolos Acadêmicos
                    </h1>
                  </div>
                  <p className="text-[var(--muted)] font-bold text-sm uppercase tracking-widest ml-1">
                    Gestão de Fichas Catalográficas e Documentação Burocrática
                  </p>
               </div>

               {usuario?.role === "ALUNO" && (
                 <Button 
                   variant="gradient" 
                   onClick={() => setIsModalOpen(true)}
                   className="rounded-2xl px-8 py-6 h-auto shadow-lg shadow-[var(--primary)]/20 relative z-10 group"
                 >
                   <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                   <span className="font-black uppercase tracking-widest text-sm">Nova Solicitação</span>
                 </Button>
               )}
            </div>

            {/* Informational Banner */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
               <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                  <Info className="w-5 h-5" />
               </div>
               <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 leading-relaxed italic">
                 Dica: Para solicitar a **Ficha Catalográfica**, você deve ter concluído sua defesa e realizado todas as correções sugeridas pela banca. O prazo médio de resposta é de 3 a 5 dias úteis.
               </p>
            </div>

            {/* List Section */}
            <ProtocoloList key={refreshKey} />
          </div>
        </main>

        {/* Modal para Novo Protocolo */}
        {isModalOpen && (
          <ProtocoloForm 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={handleRefresh}
          />
        )}

        <footer className="mt-20 py-12 border-t border-[var(--border-light)] bg-[var(--surface)]/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Logo size="sm" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 mb-6 inline-flex" showText={false} />
            <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-2">
              SIGBANCA ACADEMIC WORKFLOW
            </p>
            <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider">
              Instituto Federal do Amazonas • © {new Date().getFullYear()}
            </p>
            <div className="w-12 h-1 bg-[var(--primary)]/20 mx-auto mt-6 rounded-full"></div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
