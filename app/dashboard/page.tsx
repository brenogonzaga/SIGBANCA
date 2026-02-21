"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import { TrabalhoList } from "../components/trabalhos/TrabalhoList";
import { TrabalhoDetail } from "../components/trabalhos/TrabalhoDetail";
import { Trabalho } from "../types";
import { BancaList } from "../components/bancas/BancaList";
import { UsuarioList } from "../components/usuarios/UsuarioList";
import { Dashboard } from "../components/dashboard/Dashboard";
import { Navigation } from "../components/layout/Navigation";
import { Logo } from "../components/ui/Logo";
import { TrabalhoListItem } from "../types/custom";

export default function DashboardPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<
    "dashboard" | "trabalhos" | "bancas" | "usuarios"
  >("dashboard");
  const [selectedTrabalho, setSelectedTrabalho] = useState<Trabalho | null>(null);

  const handleViewChange = (view: "dashboard" | "trabalhos" | "bancas" | "usuarios") => {
    setActiveView(view);
    if (view !== "dashboard") {
      router.push(`/${view}`);
    }
  };

  const handleSelectTrabalho = (trabalho: TrabalhoListItem) => {
    router.push(`/trabalhos/${trabalho.id}`);
  };

  const renderContent = () => {
    if (selectedTrabalho) {
      return (
        <TrabalhoDetail trabalho={selectedTrabalho} onBack={() => setSelectedTrabalho(null)} />
      );
    }

    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "trabalhos":
        return <TrabalhoList onSelectTrabalho={handleSelectTrabalho} />;
      case "bancas":
        return <BancaList />;
      case "usuarios":
        return <UsuarioList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView={activeView} onViewChange={handleViewChange} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</main>

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
