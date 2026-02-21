"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Logo } from "@/app/components/ui/Logo";
import { Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, logout, usuario, token } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [redirectTimer, setRedirectTimer] = useState(5);

  useEffect(() => {
    if (token && usuario && redirectTimer > 0) {
      const timer = setTimeout(() => {
        setRedirectTimer(redirectTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (token && usuario && redirectTimer === 0) {
      router.push("/dashboard");
    }
  }, [token, usuario, router, redirectTimer]);

  const handleLogout = () => {
    logout();
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData.email, formData.senha);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  if (token && usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12 animate-fade-in">
        {/* Padrão de fundo decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <Card className="w-full max-w-md relative animate-scale-in shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <Logo size="lg" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-4 rounded-xl mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Você já está logado!</p>
                <p className="text-sm opacity-90">Bem-vindo, {usuario.nome}</p>
                <p className="text-xs opacity-75 mt-2">
                  Redirecionando para o dashboard em {redirectTimer} segundo
                  {redirectTimer !== 1 ? "s" : ""}...
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
                variant="gradient"
              >
                Ir para o Dashboard
              </Button>

              <Button onClick={handleLogout} className="w-full" variant="outline">
                Fazer Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12 animate-fade-in">
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[var(--primary)] rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.08] animate-pulse"></div>
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[var(--accent)] rounded-full mix-blend-multiply filter blur-[120px] opacity-[0.08] animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-[30%] left-[20%] w-[20vw] h-[20vw] bg-purple-400 rounded-full mix-blend-multiply filter blur-[80px] opacity-[0.05] animate-float"
        ></div>
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.3]"></div>
      </div>

      <Card className="w-full max-w-md relative animate-scale-in shadow-2xl glass border-white/20" gradient>
        <CardContent className="p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Faça login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-start gap-3 animate-slide-in-up">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2 ml-1"
              >
                Email Acadêmico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--muted-light)] w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-base pl-11 py-3.5"
                  placeholder="seu.email@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="senha"
                className="block text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2 ml-1"
              >
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[var(--muted-light)] w-4 h-4" />
                <input
                  id="senha"
                  type="password"
                  required
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="input-base pl-11 py-3.5"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" variant="gradient" isLoading={isLoading}>
              Entrar
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Não tem uma conta? </span>
              <Link
                href="/signup"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
