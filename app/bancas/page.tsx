"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { BancaList } from "../components/bancas/BancaList";
import { CalendarView } from "../components/bancas/CalendarView";
import { Navigation } from "../components/layout/Navigation";
import { Logo } from "../components/ui/Logo";
import { Button } from "../components/ui/Button";
import { LayoutGrid, Calendar as CalendarIcon, Plus } from "lucide-react";
import Link from "next/link";

export default function BancasPage() {
  const router = useRouter();
  const { token, usuario } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [bancas, setBancas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canCreate = usuario?.role === "COORDENADOR" || usuario?.role === "ADMIN";

  useEffect(() => {
    async function fetchBancas() {
      if (!token) return;
      try {
        const response = await fetch("/api/bancas", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setBancas(data);
        }
      } catch (error) {
        console.error("Erro ao carregar bancas:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBancas();
  }, [token]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="bancas" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div>
              <h1 className="text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                Gestão de <span className="bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] bg-clip-text text-transparent italic">Bancas</span>
              </h1>
              <p className="text-[var(--muted)] font-medium mt-1">Acompanhe o cronograma acadêmico e as avaliações agendadas.</p>
            </div>

            <div className="flex items-center gap-4 bg-[var(--surface)] p-2 rounded-[24px] border border-[var(--border)] shadow-sm">
              <div className="flex p-1 bg-[var(--surface-light)]/50 rounded-2xl border border-[var(--border-light)]">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === "list"
                      ? "bg-[var(--foreground)] text-white shadow-lg shadow-black/10"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    viewMode === "calendar"
                      ? "bg-[var(--foreground)] text-white shadow-lg shadow-black/10"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Calendário
                </button>
              </div>

              {canCreate && (
                <Link href="/bancas/cadastrar">
                  <Button variant="gradient" className="rounded-2xl px-6 py-5 shadow-xl shadow-indigo-500/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-[var(--surface)] rounded-[40px] border border-[var(--border)] border-dashed">
              <div className="w-16 h-16 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-6"></div>
              <p className="text-[var(--muted)] font-bold uppercase tracking-widest text-xs">Sincronizando Cronograma...</p>
            </div>
          ) : viewMode === "list" ? (
            <BancaList initialBancas={bancas} hideHeader={true} />
          ) : (
            <CalendarView bancas={bancas} />
          )}
        </main>

        <footer className="mt-20 py-12 border-t border-[var(--border-light)] bg-[var(--surface)]/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Logo size="sm" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 mb-6 inline-flex" showText={false} />
            <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-2">
              SIGBANCA
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
