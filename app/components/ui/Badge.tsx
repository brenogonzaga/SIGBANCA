import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "gradient";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  const variants = {
    default:
      "bg-[var(--border-light)] text-[var(--muted)] ring-1 ring-[var(--border)]",
    success:
      "bg-[var(--success-light)] text-[var(--success)] ring-1 ring-[#10B981]/30",
    warning:
      "bg-[var(--warning-light)] text-[var(--warning)] ring-1 ring-[#F59E0B]/30",
    danger:
      "bg-[var(--error-light)] text-[var(--error)] ring-1 ring-[#EF4444]/30",
    info: 
      "bg-[var(--info-light)] text-[var(--info)] ring-1 ring-[#3B82F6]/30",
    purple:
      "bg-[#F5F3FF] text-[#7C3AED] dark:bg-[#2E204E] dark:text-[#A78BFA] ring-1 ring-[#7C3AED]/30",
    gradient: "bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] text-white shadow-sm",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const dotColors = {
    default: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    purple: "bg-purple-500",
    gradient: "bg-white",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} animate-pulse`}></span>
      )}
      {children}
    </span>
  );
}
