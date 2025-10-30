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
        className={`${currentSize.container} rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center relative overflow-hidden shadow-lg hover-lift`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

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
          <span className={`${currentSize.text} font-bold gradient-text`}>SIGBANCA</span>
          {size !== "sm" && (
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wide">
              Sistema de Gestão de Bancas
            </span>
          )}
        </div>
      )}
    </div>
  );
}
