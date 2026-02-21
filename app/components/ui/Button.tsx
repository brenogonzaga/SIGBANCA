import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline" | "ghost" | "gradient";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden inline-flex items-center justify-center gap-2";

  const variants = {
    primary:
      "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-[var(--shadow-colored)] hover:shadow-lg active:scale-[0.98]",
    secondary:
      "bg-white dark:bg-[var(--surface-elevated)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--background)] shadow-sm active:scale-[0.98]",
    danger:
      "bg-[var(--error)] hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-[0.98]",
    success:
      "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-md hover:shadow-lg active:scale-[0.98]",
    outline:
      "border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)] active:scale-[0.98]",
    ghost:
      "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-light)] active:scale-[0.98]",
    gradient:
      "bg-gradient-to-r from-[var(--primary)] to-[#7C3AED] hover:opacity-90 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98] after:absolute after:inset-0 after:bg-white/10 after:opacity-0 hover:after:opacity-100 after:transition-opacity",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base font-bold",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Processando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
