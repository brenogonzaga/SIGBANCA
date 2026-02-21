import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className = "", hover = false, gradient = false }: CardProps) {
  return (
    <div
      className={`bg-[var(--surface)] dark:bg-[var(--surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow)] ${
        hover
          ? "transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-1 hover:border-[var(--border-strong)]"
          : "transition-shadow duration-200"
      } ${
        gradient
          ? "bg-gradient-to-br from-[var(--surface)] to-[var(--background)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div
      className={`p-6 border-b border-[var(--border-light)] dark:border-[var(--border)] bg-[var(--background)]/30 dark:bg-black/10 rounded-t-[var(--radius-lg)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-5 md:p-8 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h3
      className={`text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }: CardProps) {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1.5 ${className}`}>{children}</p>
  );
}

export function CardFooter({ children, className = "" }: CardProps) {
  return (
    <div
      className={`px-6 py-4 bg-[var(--background)]/20 dark:bg-black/5 border-t border-[var(--border-light)] dark:border-[var(--border)] rounded-b-[var(--radius-lg)] ${className}`}
    >
      {children}
    </div>
  );
}
