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
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md ${
        hover
          ? "transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          : "transition-shadow duration-200"
      } ${
        gradient
          ? "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
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
      className={`p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-t-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
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
      className={`px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl ${className}`}
    >
      {children}
    </div>
  );
}
