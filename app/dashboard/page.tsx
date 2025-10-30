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

  const handleSelectTrabalho = (trabalho: Trabalho) => {
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation activeView={activeView} onViewChange={handleViewChange} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{renderContent()}</main>

        <footer className="border-t border-gray-200 dark:border-gray-700 mt-12 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Sistema de Gerenciamento de Bancas Acadêmicas - IFAM © 2025
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
