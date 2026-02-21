"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  confirmVariant?: "primary" | "danger" | "success" | "secondary";
  cancelText?: string;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirmar",
  confirmVariant = "primary",
  cancelText = "Cancelar",
  isLoading = false,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop with extreme glassmorphism */}
      <div
        className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xl transition-all duration-500 animate-in fade-in"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${sizeClasses[size]} transform transition-all duration-500 animate-in zoom-in-95 slide-in-from-bottom-4 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.4)] rounded-[40px] overflow-hidden group`}
      >
        {/* Subtle Gradient Border */}
        <div className="absolute inset-0 p-[2px] rounded-[40px] bg-gradient-to-br from-white/20 via-transparent to-white/5 pointer-events-none z-10"></div>
        
        <div className="relative bg-[var(--surface)] dark:bg-[#1E293B] rounded-[38px] overflow-hidden z-0">
          {/* Header Section */}
          <div className="flex items-center justify-between px-8 py-7 border-b border-[var(--border-light)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] via-[#7C3AED] to-emerald-500 opacity-50"></div>
            
            <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight font-[Plus\ Jakarta\ Sans]">
              {title}
            </h3>
            
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group/close"
            >
              <X className="w-5 h-5 transition-transform group-hover/close:rotate-90 duration-300" />
            </button>
          </div>

          {/* Body Section */}
          <div className="px-8 py-10 max-h-[70vh] overflow-y-auto custom-scrollbar relative">
            <div className="absolute top-4 right-8 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 text-[var(--foreground)] leading-relaxed font-medium">
              {children}
            </div>
          </div>

          {/* Footer Section */}
          {onConfirm && (
            <div className="flex items-center justify-end gap-5 px-8 py-8 bg-[var(--surface-light)]/30 backdrop-blur-sm border-t border-[var(--border-light)]">
              <button
                disabled={isLoading}
                onClick={onClose}
                className="px-6 py-3 text-xs font-black text-[var(--muted)] hover:text-[var(--foreground)] transition-all uppercase tracking-widest"
              >
                {cancelText}
              </button>
              <Button 
                variant={confirmVariant === "primary" ? "gradient" : confirmVariant} 
                onClick={onConfirm} 
                isLoading={isLoading}
                size="lg"
                className="rounded-2xl px-10 shadow-xl shadow-[var(--primary)]/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              >
                {confirmText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "secondary" | "primary";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      onConfirm={onConfirm}
      confirmText={confirmText}
      confirmVariant={variant}
      cancelText={cancelText}
      isLoading={isLoading}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-[var(--foreground)] text-lg font-medium leading-relaxed">
          {message}
        </p>
        <div className="p-4 rounded-2xl bg-[var(--danger)]/5 border border-[var(--danger)]/10 text-[var(--danger)] text-xs font-bold uppercase tracking-wide flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] mt-1 animate-pulse" />
          Esta ação é definitiva e não poderá ser revertida.
        </div>
      </div>
    </Modal>
  );
}
