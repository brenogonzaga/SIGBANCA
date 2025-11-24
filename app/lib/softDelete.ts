/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Extensão do Prisma Client para adicionar suporte a soft delete
 * Automaticamente filtra registros deletados e fornece métodos para soft delete
 */

// Middleware para filtrar registros deletados automaticamente
export const softDeleteMiddleware = async (params: any, next: any) => {
  // Lista de modelos que suportam soft delete
  const softDeleteModels = ["usuario", "trabalho", "banca"];

  if (softDeleteModels.includes(params.model?.toLowerCase() || "")) {
    // Operações de leitura
    if (params.action === "findUnique" || params.action === "findFirst") {
      params.action = "findFirst";
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }

    if (params.action === "findMany") {
      if (params.args.where) {
        if (params.args.where.deletedAt === undefined) {
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          };
        }
      } else {
        params.args.where = { deletedAt: null };
      }
    }

    // Transformar delete em soft delete
    if (params.action === "delete") {
      params.action = "update";
      params.args.data = { deletedAt: new Date() };
    }

    if (params.action === "deleteMany") {
      params.action = "updateMany";
      if (params.args.data !== undefined) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
    }
  }

  return next(params);
};

/**
 * Função auxiliar para restaurar um registro deletado
 */
export async function restore<T>(
  model: { update: (args: { where: { id: string }; data: { deletedAt: null } }) => Promise<T> },
  id: string
): Promise<T> {
  return model.update({
    where: { id },
    data: { deletedAt: null },
  });
}

/**
 * Função auxiliar para deletar permanentemente
 */
export async function forceDelete<T>(
  model: { delete: (args: { where: { id: string } }) => Promise<T> },
  id: string
): Promise<T> {
  return model.delete({
    where: { id },
  });
}

/**
 * Função auxiliar para buscar incluindo deletados
 */
export function withDeleted() {
  return {
    where: {
      deletedAt: undefined, // Remove filtro de deletedAt
    },
  };
}

/**
 * Função auxiliar para buscar apenas deletados
 */
export function onlyDeleted() {
  return {
    where: {
      deletedAt: { not: null },
    },
  };
}
