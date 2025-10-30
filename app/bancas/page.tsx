"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";
import { BancaList } from "../components/bancas/BancaList";
import { Navigation } from "../components/layout/Navigation";

export default function BancasPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation activeView="bancas" onViewChange={(view) => router.push(`/${view}`)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BancaList />
        </main>

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
