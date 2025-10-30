"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { TrabalhoDetail } from "../../components/trabalhos/TrabalhoDetail";
import { Trabalho } from "../../types";
import { ArrowLeft } from "lucide-react";
import { Navigation } from "@/app/components/layout/Navigation";

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation activeView="trabalhos" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Carregando trabalho...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/trabalhos")}
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mx-auto"
              >
                <ArrowLeft size={16} />
                Voltar para trabalhos
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
      </div>
    </ProtectedRoute>
  );
}
