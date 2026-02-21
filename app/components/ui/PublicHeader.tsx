"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "./Button";
import { Logo } from "./Logo";

interface PublicHeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  title?: string;
}

export function PublicHeader({
  showBackButton = false,
  backUrl = "/",
  title,
}: PublicHeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b border-[var(--border)] sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-6">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(backUrl)}
                className="flex items-center gap-2 hover:bg-[var(--border-light)] rounded-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline font-bold">Voltar</span>
              </Button>
            )}
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => router.push("/")}
            >
              <Logo size="md" />
            </div>
            {title && (
              <div className="hidden lg:flex items-center gap-3">
                <div className="h-6 w-px bg-[var(--border)]"></div>
                <span className="text-[var(--muted)] font-black text-xs uppercase tracking-[0.2em]">
                  {title}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/trabalhos-publicos")}
              className="hidden sm:flex items-center gap-2 font-bold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-light)] rounded-xl"
            >
              <Home className="w-4 h-4" />
              Público
            </Button>
            <Button 
              variant="gradient" 
              size="sm" 
              onClick={() => router.push("/login")}
              className="rounded-xl shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:scale-105 transition-all"
            >
              Acessar Sistema
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
