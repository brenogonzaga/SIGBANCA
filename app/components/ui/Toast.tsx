"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = crypto.randomUUID();
    const newToast: Toast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <XCircle className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200";
      case "error":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200";
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] space-y-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-5 px-6 py-5 rounded-[24px] border-2 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right-8 duration-500 min-w-[340px] max-w-md group overflow-hidden relative ${getStyles(
              toast.type
            )}`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-white/5 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
            
            <div className="relative z-10 p-2 rounded-lg bg-white/90 shadow-sm">
               {getIcon(toast.type)}
            </div>
            
            <div className="flex-1 relative z-10 pr-1">
              <p className="text-xs sm:text-sm font-black tracking-tight leading-tight">{toast.message}</p>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="relative z-10 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-all text-current/60 hover:text-current"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            {/* Bottom Progress Indicator (Visual only for now) */}
            <div className="absolute bottom-0 left-0 h-1 bg-current/20 w-full">
               <div className="h-full bg-current/40 animate-progress-shrink origin-left"></div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return context;
}
