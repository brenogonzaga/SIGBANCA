"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import { UsuarioList } from "../components/usuarios/UsuarioList";
import { Navigation } from "../components/layout/Navigation";

export default function UsuariosPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation activeView="usuarios" onViewChange={(view) => router.push(`/${view}`)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UsuarioList />
        </main>
      </div>
    </ProtectedRoute>
  );
}
