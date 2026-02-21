import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "white" | "accent";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "primary",
  className = "",
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const variants = {
    primary: "border-[var(--primary)]",
    secondary: "border-[var(--muted)]",
    white: "border-white",
    accent: "border-[var(--accent)]",
  };

  return (
    <div className={`inline-block ${sizes[size]} ${className}`}>
      <div
        className={`w-full h-full rounded-full border-3 ${variants[variant]} border-t-transparent animate-spin`}
        style={{ borderWidth: "3px" }}
      />
    </div>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className = "", count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-[var(--background)] rounded-xl border border-[var(--border-light)] ${className}`}
        />
      ))}
    </>
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = "Carregando..." }: LoadingPageProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] animate-fade-in relative overflow-hidden">
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.2] pointer-events-none"></div>
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 text-center">
        <div className="flex justify-center mb-10">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 animate-pulse"></div>
            <LoadingSpinner size="lg" className="relative" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-full shadow-lg shadow-indigo-500/20"></div>
            </div>
          </div>
        </div>
        <p className="text-[var(--foreground)] text-xl font-black tracking-tight font-[Plus\\ Jakarta\\ Sans] mb-2">
          {message}
        </p>
        <p className="text-[var(--muted)] text-sm font-medium">Preparando seu ambiente acadêmico...</p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  title?: boolean;
  lines?: number;
}

export function LoadingCard({ title = true, lines = 3 }: LoadingCardProps) {
  return (
    <div className="bg-[var(--surface)] dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 shadow-sm">
      {title && <LoadingSkeleton className="h-6 w-1/3 mb-6" />}
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <LoadingSkeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}
