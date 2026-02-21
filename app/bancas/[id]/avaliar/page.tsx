"use client";

import ProtectedRoute from "../../../components/ProtectedRoute";
import { Navigation } from "../../../components/layout/Navigation";
import { EvaluationForm } from "../../../components/bancas/EvaluationForm";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { ShieldAlert, Star } from "lucide-react";
import { Logo } from "../../../components/ui/Logo";

export default function AvaliarBancaPage() {
  const router = useRouter();
  const params = useParams();
  const { usuario } = useAuth();
  const id = params.id as string;

  // Professores, Coordenadores e Admins podem avaliar (se forem membros)
  // A lógica de membro é tratada dentro do componente EvaluationForm

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="dashboard" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[28px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/10">
                  <Star className="w-8 h-8 fill-white/20" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
                    Portal de <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent italic">Avaliação</span>
                  </h2>
                  <p className="text-[var(--muted)] font-medium mt-1">Registro de parecer técnico e notas de proficiência acadêmica.</p>
                </div>
              </div>
            </div>

            <EvaluationForm bancaId={id} />
          </div>
        </main>

        <footer className="mt-20 py-12 border-t border-[var(--border-light)] bg-[var(--surface)]/30 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-[0.1] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Logo size="sm" className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 mb-6 inline-flex" showText={false} />
            <p className="text-xs font-black text-[var(--muted-light)] uppercase tracking-[0.3em] mb-2">
              SIGBANCA ACADEMIC PERFORMANCE
            </p>
            <p className="text-[10px] font-bold text-[var(--muted-light)] uppercase tracking-wider">
              Qualidade Acadêmica Certificada • © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
