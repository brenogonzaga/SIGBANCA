"use client";

import React from "react";
import { Navigation } from "../components/layout/Navigation";
import { ConfiguracoesView } from "../components/configuracoes/ConfiguracoesView";
import ProtectedRoute from "../components/ProtectedRoute";

export default function ConfiguracoesPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COORDENADOR"]}>
      <div className="min-h-screen bg-[var(--background)]">
        <Navigation />
        <main className="container mx-auto px-4 pt-28 pb-12 overflow-x-hidden">
          <ConfiguracoesView />
        </main>
      </div>
    </ProtectedRoute>
  );
}
