"use client";

import ProtectedRoute from "../components/ProtectedRoute";
import { Navigation } from "../components/layout/Navigation";
import { ReportsView } from "../components/relatorios/ReportsView";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { ShieldAlert, BarChart3 } from "lucide-react";
import { Logo } from "../components/ui/Logo";

export default function RelatoriosPage() {
  const router = useRouter();
  const { usuario } = useAuth();

  const isAuthorized = usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="dashboard" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!isAuthorized ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-[40px] bg-red-500/10 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/5">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Acesso Restrito</h1>
                <p className="text-[var(--muted)] font-medium max-w-md mx-auto">
                  Relatórios analíticos e indicadores estratégicos estão disponíveis apenas para a coordenação.
                </p>
              </div>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-8 py-4 bg-[var(--foreground)] text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/10"
              >
                Voltar ao Início
              </button>
            </div>
          ) : (
            <div className="space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/10">
                    <BarChart3 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                      Inteligência <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent italic">Estratégica</span>
                    </h2>
                    <p className="text-[var(--muted)] font-medium mt-1">Indicadores consolidados de desempenho e produtividade acadêmica.</p>
                  </div>
                </div>
              </div>

              <ReportsView />
            </div>
          )}
        </main>

        <footer className="mt-20 py-12 border-t border-[var(--border-light)] bg-[var(--surface)]/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Logo size="sm" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 mb-6 inline-flex" showText={false} />
            <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-2">
              SIGBANCA ANALYTICS
            </p>
            <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider">
              Sistema Integrado de Gestão de Produção Acadêmica • © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
