"use client";

import { use } from "react";
import BancaForm from "@/app/components/bancas/BancaForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditarBancaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

 
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-[var(--surface)] border-b border-[var(--border)] pt-12 pb-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-[var(--primary)]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[50%] bg-[#7C3AED]/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <Link href="/bancas">
            <button className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors mb-8 group">
              <div className="w-8 h-8 rounded-xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--primary-light)] group-hover:bg-[var(--primary-light)]/10 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest">Gestão de Bancas</span>
            </button>
          </Link>

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black text-[var(--foreground)] tracking-tight mb-4">
              Ajustar <span className="bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] bg-clip-text text-transparent italic">Banca</span>
            </h1>
            <p className="text-[var(--muted)] text-lg font-medium max-w-2xl mx-auto">
              Atualize as informações do agendamento para garantir que todos os membros e o local estejam corretos.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-6 -mt-12 pb-20 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <BancaForm bancaId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
