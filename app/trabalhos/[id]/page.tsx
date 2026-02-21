"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { TrabalhoDetail } from "../../components/trabalhos/TrabalhoDetail";
import { Trabalho } from "../../types";
import { ArrowLeft } from "lucide-react";
import { Navigation } from "@/app/components/layout/Navigation";
import { LoadingSpinner } from "@/app/components/ui/Loading";
import { Logo } from "@/app/components/ui/Logo";

export default function TrabalhoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [trabalho, setTrabalho] = useState<Trabalho | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrabalho = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`/api/trabalhos/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar trabalho");
        }

        const data = await response.json();
        setTrabalho(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchTrabalho();
    }
  }, [params.id]);

  // Função para recarregar trabalho após updates
  const handleRefetch = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/trabalhos/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrabalho(data);
      }
    } catch (err) {
      console.error("Erro ao recarregar trabalho:", err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="trabalhos" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <LoadingSpinner size="lg" className="mb-6" />
              <p className="text-[var(--muted)] font-black uppercase tracking-widest text-xs">
                Carregando Documento...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12 surface-card border border-[var(--border)] rounded-2xl p-8 max-w-md mx-auto mt-20">
              <p className="text-[var(--error)] font-bold mb-4">{error}</p>
              <button
                onClick={() => router.push("/trabalhos")}
                className="text-[var(--primary)] hover:underline flex items-center gap-2 mx-auto uppercase text-xs font-black tracking-widest"
              >
                <ArrowLeft size={14} />
                Voltar para listagem
              </button>
            </div>
          ) : trabalho ? (
            <TrabalhoDetail
              trabalho={trabalho}
              onBack={() => router.push("/trabalhos")}
              onUpdate={handleRefetch}
            />
          ) : null}
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
