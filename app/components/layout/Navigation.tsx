"use client";

import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Calendar, 
  History,
  ShieldCheck,
  Search,
  Globe,
  BarChart3
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/app/components/ui/Logo";
import { Badge } from "@/app/components/ui/Badge";

interface NavigationProps {
  activeView: "dashboard" | "trabalhos" | "bancas" | "usuarios";
  onViewChange: (view: "dashboard" | "trabalhos" | "bancas" | "usuarios") => void;
}

const roleLabels: Record<string, string> = {
  ALUNO: "Aluno",
  PROFESSOR: "Professor",
  COORDENADOR: "Coordenador",
  PROFESSOR_BANCA: "Avaliador",
  ADMIN: "Administrador",
};

const roleVariants: Record<
  string,
  "default" | "success" | "warning" | "danger" | "info" | "purple"
> = {
  ALUNO: "info",
  PROFESSOR: "success",
  COORDENADOR: "purple",
  PROFESSOR_BANCA: "warning",
  ADMIN: "danger",
};

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const router = useRouter();

  const allMenuItems = [
    {
      id: "dashboard" as const,
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["ALUNO", "PROFESSOR", "COORDENADOR", "PROFESSOR_BANCA", "ADMIN"] as const,
    },
    {
      id: "trabalhos" as const,
      label: "Trabalhos",
      icon: FileText,
      roles: ["ALUNO", "PROFESSOR", "COORDENADOR", "PROFESSOR_BANCA", "ADMIN"] as const,
    },
    {
      id: "bancas" as const,
      label: "Bancas",
      icon: Calendar,
      roles: ["ALUNO", "PROFESSOR", "COORDENADOR", "PROFESSOR_BANCA", "ADMIN"] as const,
    },
    {
      id: "usuarios" as const,
      label: "Usuários",
      icon: Users,
      roles: ["COORDENADOR", "ADMIN"] as const,
    },
  ];

  const menuItems = allMenuItems.filter(
    (item) => usuario?.role && (item.roles as readonly string[]).includes(usuario.role)
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleViewChange = (view: "dashboard" | "trabalhos" | "bancas" | "usuarios") => {
    setMobileMenuOpen(false);
    router.push(view === "dashboard" ? "/dashboard" : `/${view}`);
    onViewChange(view);
  };

  const handleProfileClick = () => {
    setUserMenuOpen(false);
    router.push("/perfil");
  };

  return (
    <nav className="sticky top-4 z-50 px-4 mb-6">
      <div className="max-w-7xl mx-auto glass rounded-2xl shadow-lg border border-[var(--border)]">
        <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div
              className="flex-shrink-0 flex items-center cursor-pointer transition-transform hover:scale-105"
              onClick={() => router.push("/dashboard")}
            >
              <Logo size="sm" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-[var(--shadow-colored)] scale-105"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-light)]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Link para Trabalhos Públicos */}
            <button
              onClick={() => router.push("/trabalhos-publicos")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border-light)] transition-all duration-300"
            >
              <Globe className="w-4 h-4" />
              Público
            </button>

            {/* Desktop Actions Section */}
            <div className="flex items-center gap-3">
              <NotificationBell />

              {(usuario?.role === "ADMIN" || usuario?.role === "COORDENADOR") && (
                <>
                  <Link
                    href="/relatorios"
                    className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--muted)] hover:text-emerald-500 border border-[var(--border)] transition-all flex items-center justify-center"
                    title="Análise e Relatórios"
                  >
                    <BarChart3 className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/auditoria"
                    className="p-2.5 rounded-xl bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--border)] transition-all flex items-center justify-center"
                    title="Logs de Auditoria"
                  >
                    <History className="w-5 h-5" />
                  </Link>
                </>
              )}

              {/* Separador */}
              <div className="h-6 w-px bg-[var(--border)] mx-1"></div>

              {/* User Menu Desktop */}
              <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full bg-[var(--background)] hover:bg-[var(--border-light)] border border-[var(--border)] transition-all duration-300 group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] via-[#7C3AED] to-[var(--accent)] flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:shadow-md transition-all">
                  {usuario?.nome?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden xl:block mr-2">
                  <div className="text-xs font-bold text-[var(--foreground)] truncate max-w-[120px]">
                    {usuario?.nome}
                  </div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-10 overflow-hidden animate-scale-in">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">Meu Perfil</span>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 animate-slide-in-up">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* User info mobile */}
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {usuario?.nome?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100">
                  {usuario?.nome}
                </div>
                <Badge size="sm" variant={roleVariants[usuario?.role || ""] || "default"}>
                  {roleLabels[usuario?.role || ""]}
                </Badge>
              </div>
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}

            {/* Link para Trabalhos Públicos Mobile */}
            <button
              onClick={() => {
                router.push("/trabalhos-publicos");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              <Globe className="w-5 h-5" />
              Trabalhos Públicos
            </button>

            {/* Profile button mobile */}
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              <User className="w-5 h-5" />
              Meu Perfil
            </button>

            {/* Logout button mobile */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      )}
      </div>
    </nav>
  );
}
