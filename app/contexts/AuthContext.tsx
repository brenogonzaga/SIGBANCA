"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole } from "@prisma/client";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  matricula?: string | null;
  curso?: string | null;
  titulacao?: string | null;
  departamento?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  dataIngresso?: string | null;
  areaAtuacao?: string | null;
  lattes?: string | null;
  createdAt?: string;
}

interface AuthContextData {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface SignupData {
  email: string;
  senha: string;
  nome: string;
  role: string;
  cpf?: string;
  telefone?: string;
  matricula?: string;
  curso?: string;
  titulacao?: string;
  departamento?: string;
  areaAtuacao?: string;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUsuario = localStorage.getItem("usuario");

    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao fazer login");
    }

    const data = await response.json();

    setToken(data.token);
    setUsuario(data.usuario);

    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
  };

  const signup = async (data: SignupData) => {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao criar conta");
    }

    await login(data.email, data.senha);
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!token && !!usuario,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
