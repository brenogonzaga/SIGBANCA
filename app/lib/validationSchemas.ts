import { z } from "zod";
import { TrabalhoStatus, UserRole, BancaStatus, PapelBanca } from "@prisma/client";

/**
 * Schemas de validação centralizados usando Zod
 * Para prevenção de dados inconsistentes e segurança
 */

// ============ USUÁRIOS ============

export const createUsuarioSchema = z.object({
  email: z.email("Email inválido"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z
    .string()
    .regex(/^\d{11}$/, "CPF inválido")
    .optional(),
  telefone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido")
    .optional(),
  role: z.enum(UserRole),
  matricula: z.string().optional(),
  curso: z.string().optional(),
  titulacao: z.string().optional(),
  departamento: z.string().optional(),
  areaAtuacao: z.string().optional(),
  lattes: z.string().url("URL do Lattes inválida").optional(),
});

export const updateUsuarioSchema = z.object({
  email: z.email("Email inválido").optional(),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
  cpf: z
    .string()
    .regex(/^\d{11}$/, "CPF inválido")
    .optional(),
  telefone: z
    .string()
    .regex(/^\d{10,11}$/, "Telefone inválido")
    .optional(),
  role: z.enum(UserRole).optional(),
  ativo: z.boolean().optional(),
  matricula: z.string().optional(),
  curso: z.string().optional(),
  titulacao: z.string().optional(),
  departamento: z.string().optional(),
  areaAtuacao: z.string().optional(),
  lattes: z.string().url("URL do Lattes inválida").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

// ============ TRABALHOS ============

export const createTrabalhoSchema = z.object({
  titulo: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  descricao: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres"),
  curso: z.string().min(1, "Curso é obrigatório"),
  palavrasChave: z
    .array(z.string())
    .min(1, "Pelo menos uma palavra-chave é obrigatória")
    .optional(),
  alunoId: z.string().cuid("ID de aluno inválido"),
  orientadorId: z.string().cuid("ID de orientador inválido"),
  dataInicio: z.string().or(z.date()).optional(),
});

export const updateTrabalhoSchema = z.object({
  titulo: z.string().min(5, "Título deve ter no mínimo 5 caracteres").optional(),
  descricao: z.string().min(20, "Descrição deve ter no mínimo 20 caracteres").optional(),
  curso: z.string().min(1, "Curso é obrigatório").optional(),
  palavrasChave: z.array(z.string()).optional(),
  status: z.nativeEnum(TrabalhoStatus).optional(),
  orientadorId: z.string().cuid("ID de orientador inválido").optional(),
});

export const transitionStatusSchema = z.object({
  novoStatus: z.nativeEnum(TrabalhoStatus),
  observacao: z.string().max(500, "Observação muito longa").optional(),
});

// ============ VERSÕES ============

// Plataformas externas suportadas
export const plataformasExternas = [
  "google_docs",
  "google_drive",
  "onedrive",
  "dropbox",
  "overleaf",
  "notion",
  "outro",
] as const;

// Schema para upload de arquivo
export const createVersaoArquivoSchema = z.object({
  trabalhoId: z.string().cuid("ID de trabalho inválido"),
  tipoDocumento: z.literal("ARQUIVO"),
  changelog: z.string().max(1000, "Changelog muito longo").optional(),
});

// Schema para URL externa (Google Docs, etc.)
export const createVersaoUrlSchema = z.object({
  trabalhoId: z.string().cuid("ID de trabalho inválido"),
  tipoDocumento: z.literal("URL_EXTERNA"),
  urlExterna: z.string().url("URL inválida"),
  plataforma: z.enum(plataformasExternas, "Plataforma não suportada"),
  tituloDocumento: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(255, "Título muito longo"),
  changelog: z.string().max(1000, "Changelog muito longo").optional(),
});

// Schema unificado que aceita arquivo OU URL
export const createVersaoSchema = z.discriminatedUnion("tipoDocumento", [
  createVersaoArquivoSchema,
  createVersaoUrlSchema,
]);

// Schema legado para compatibilidade
export const createVersaoLegacySchema = z.object({
  trabalhoId: z.string().cuid("ID de trabalho inválido"),
  changelog: z.string().max(1000, "Changelog muito longo").optional(),
});

// ============ COMENTÁRIOS ============

export const createComentarioSchema = z.object({
  texto: z.string().min(1, "Comentário não pode ser vazio").max(5000, "Comentário muito longo"),
  versaoId: z.cuid("ID de versão inválido"),
  parentId: z.cuid("ID de comentário pai inválido").optional(),
});

export const updateComentarioSchema = z.object({
  texto: z.string().min(1, "Comentário não pode ser vazio").max(5000, "Comentário muito longo"),
});

// ============ BANCAS ============

export const createBancaSchema = z.object({
  trabalhoId: z.string().cuid("ID de trabalho inválido"),
  data: z.string().or(z.date()),
  horario: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido (HH:MM)"),
  local: z.string().min(3, "Local deve ter no mínimo 3 caracteres"),
  modalidade: z.enum(["PRESENCIAL", "REMOTO", "HIBRIDO"]),
  linkReuniao: z.string().url("URL inválida").optional(),
  observacoes: z.string().max(1000, "Observações muito longas").optional(),
  membros: z
    .array(
      z.object({
        usuarioId: z.cuid("ID de usuário inválido"),
        papel: z.enum(PapelBanca),
      })
    )
    .min(2, "A banca deve ter no mínimo 2 membros"),
});

export const updateBancaSchema = z.object({
  data: z.string().or(z.date()).optional(),
  horario: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Horário inválido (HH:MM)")
    .optional(),
  local: z.string().min(3, "Local deve ter no mínimo 3 caracteres").optional(),
  modalidade: z.enum(["PRESENCIAL", "REMOTO", "HIBRIDO"]).optional(),
  linkReuniao: z.string().url("URL inválida").optional(),
  status: z.enum(BancaStatus).optional(),
  notaFinal: z.number().min(0).max(10).optional(),
  resultado: z.enum(["APROVADO", "APROVADO_COM_RESSALVAS", "REPROVADO"]).optional(),
  ataUrl: z.url("URL inválida").optional(),
  observacoes: z.string().max(1000, "Observações muito longas").optional(),
});

export const addMembroBancaSchema = z.object({
  bancaId: z.cuid("ID de banca inválido"),
  usuarioId: z.cuid("ID de usuário inválido"),
  papel: z.enum(PapelBanca),
});

// ============ AVALIAÇÕES ============

export const createAvaliacaoSchema = z.object({
  membroId: z.cuid("ID de membro inválido"),
  nota: z.number().min(0, "Nota mínima é 0").max(10, "Nota máxima é 10"),
  parecer: z.string().min(20, "Parecer deve ter no mínimo 20 caracteres"),
  criterios: z
    .array(
      z.object({
        nome: z.string().min(1, "Nome do critério é obrigatório"),
        descricao: z.string().optional(),
        nota: z.number().min(0).max(10),
        peso: z.number().min(0).max(1).default(1),
      })
    )
    .optional(),
});

// ============ QUERY PARAMS ============

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const trabalhoFilterSchema = z.object({
  status: z.enum(TrabalhoStatus).optional(),
  alunoId: z.cuid().optional(),
  orientadorId: z.cuid().optional(),
  curso: z.string().optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const bancaFilterSchema = z.object({
  status: z.nativeEnum(BancaStatus).optional(),
  dataInicio: z.string().or(z.date()).optional(),
  dataFim: z.string().or(z.date()).optional(),
  ...paginationSchema.shape,
});

// ============ VALIDAÇÕES CUSTOMIZADAS ============

/**
 * Valida se a data é futura
 */
export const futureDate = z
  .string()
  .or(z.date())
  .refine(
    (date) => {
      const d = typeof date === "string" ? new Date(date) : date;
      return d > new Date();
    },
    { message: "Data deve ser futura" }
  );

/**
 * Valida senha forte
 */
export const strongPassword = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
  .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
  .regex(/[0-9]/, "Senha deve conter pelo menos um número");

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

/**
 * Schema de CPF validado
 */
export const cpfSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => validarCPF(val), { message: "CPF inválido" });
