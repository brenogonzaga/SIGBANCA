import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be defined in production environment");
}

const JWT_SECRET = process.env.JWT_SECRET || "development-secret-do-not-use-in-production";
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  nome: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export const PERMISSIONS = {
  ALUNO: [
    "trabalho:read_own",
    "trabalho:create",
    "trabalho:update_own",
    "versao:upload_own",
    "comentario:read_own",
  ],
  PROFESSOR: [
    "trabalho:read_assigned",
    "trabalho:update_assigned",
    "versao:read_assigned",
    "comentario:create",
    "comentario:read_all",
  ],
  COORDENADOR: [
    "trabalho:read_all",
    "trabalho:update_all",
    "banca:create",
    "banca:update",
    "banca:delete",
    "usuario:read_all",
  ],
  PROFESSOR_BANCA: ["banca:read_assigned", "avaliacao:create", "avaliacao:update_own"],
  ADMIN: ["*"],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const rolePermissions = PERMISSIONS[role];
  return rolePermissions.includes("*") || rolePermissions.includes(permission);
}

export function canAccessTrabalho(
  userRole: UserRole,
  userId: string,
  trabalhoAlunoId: string,
  trabalhoOrientadorId: string
): boolean {
  if (userRole === "ADMIN" || userRole === "COORDENADOR") {
    return true;
  }

  if (userRole === "ALUNO" && userId === trabalhoAlunoId) {
    return true;
  }

  if (
    (userRole === "PROFESSOR" || userRole === "PROFESSOR_BANCA") &&
    userId === trabalhoOrientadorId
  ) {
    return true;
  }

  return false;
}
