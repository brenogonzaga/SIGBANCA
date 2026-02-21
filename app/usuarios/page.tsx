"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import { UsuarioList } from "../components/usuarios/UsuarioList";
import { Navigation } from "../components/layout/Navigation";
import { Logo } from "../components/ui/Logo";

export default function UsuariosPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation activeView="usuarios" onViewChange={(view) => router.push(`/${view}`)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UsuarioList />
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
