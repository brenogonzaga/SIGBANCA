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
    <header className="border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40 backdrop-blur-lg bg-white/95 dark:bg-gray-800/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(backUrl)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            )}
            <div
              className="cursor-pointer transition-transform hover:scale-105"
              onClick={() => router.push("/")}
            >
              <Logo size="sm" />
            </div>
            {title && (
              <span className="hidden sm:block text-gray-500 dark:text-gray-400 font-medium">
                • {title}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/trabalhos-publicos")}
              className="hidden sm:flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Trabalhos Públicos
            </Button>
            <Button variant="gradient" size="sm" onClick={() => router.push("/login")}>
              Acessar Sistema
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
