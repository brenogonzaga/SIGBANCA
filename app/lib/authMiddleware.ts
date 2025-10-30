import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";
import { UserRole } from "@prisma/client";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export async function requireAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autenticação não fornecido" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
    }

    return payload;
  } catch {
    return NextResponse.json({ error: "Erro ao verificar autenticação" }, { status: 401 });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (request: NextRequest) => {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!allowedRoles.includes(authResult.role)) {
      return NextResponse.json(
        { error: "Acesso negado. Permissões insuficientes." },
        { status: 403 }
      );
    }

    return authResult;
  };
}

export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  options?: {
    allowedRoles?: UserRole[];
  }
) {
  return async (request: NextRequest) => {
    const middleware = options?.allowedRoles ? requireRole(options.allowedRoles) : requireAuth;

    const authResult = await middleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult);
  };
}

export function withAuthContext<T>(
  handler: (request: NextRequest, user: JWTPayload, context: T) => Promise<NextResponse>,
  options?: {
    allowedRoles?: UserRole[];
  }
) {
  return async (request: NextRequest, context: T) => {
    const middleware = options?.allowedRoles ? requireRole(options.allowedRoles) : requireAuth;

    const authResult = await middleware(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult, context);
  };
}
