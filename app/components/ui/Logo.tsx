import React from "react";
import { GraduationCap, FileCheck } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: {
      container: "w-8 h-8",
      icon: "w-4 h-4",
      text: "text-lg",
    },
    md: {
      container: "w-10 h-10",
      icon: "w-5 h-5",
      text: "text-xl",
    },
    lg: {
      container: "w-14 h-14",
      icon: "w-7 h-7",
      text: "text-3xl",
    },
  };

  const currentSize = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div
        className={`${currentSize.container} rounded-xl bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#059669] flex items-center justify-center relative overflow-hidden shadow-[var(--shadow-colored)] hover-lift`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>

        {/* Icons */}
        <div className="relative flex items-center justify-center">
          <GraduationCap
            className={`${currentSize.icon} text-white absolute -top-0.5 -left-0.5`}
          />
          <FileCheck
            className={`${currentSize.icon} text-white/80 absolute top-0.5 left-0.5`}
          />
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${currentSize.text} font-extrabold tracking-tight gradient-text font-[Plus\\ Jakarta\\ Sans]`}>
            SIGBANCA
          </span>
          {size !== "sm" && (
            <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-[0.1em] mt-0.5">
              Gestão de Bancas
            </span>
          )}
        </div>
      )}
    </div>
  );
}
