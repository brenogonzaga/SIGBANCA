import { UserRole, TrabalhoStatus, BancaStatus, PapelBanca } from "@prisma/client";

export type ModalidadeBanca = "PRESENCIAL" | "REMOTO" | "HIBRIDO";

export interface UsuarioUpdateData {
  nome?: string;
  cpf?: string;
  telefone?: string;
  ativo?: boolean;
  senha?: string;
  matricula?: string;
  curso?: string;
  dataIngresso?: string | Date;
  titulacao?: string;
  departamento?: string;
  areaAtuacao?: string;
  lattes?: string;
}

export interface UsuarioCadastroPayload {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
  role: UserRole;
  matricula?: string;
  curso?: string;
  dataIngresso?: string | Date;
  titulacao?: string;
  departamento?: string;
  areaAtuacao?: string;
  lattes?: string;
}

export interface TrabalhoListItem {
  id: string;
  titulo: string;
  descricao: string;
  curso: string;
  status: TrabalhoStatus;
  versaoAtual: number;
  dataInicio: Date | string;
  aluno: {
    id: string;
    nome: string;
    email: string;
    matricula?: string;
    curso?: string;
  };
  orientador: {
    id: string;
    nome: string;
    email: string;
    titulacao?: string;
  };
  versoes?: Array<{
    id: string;
    numeroVersao: number;
    dataUpload: Date | string;
  }>;
  banca?: {
    id: string;
    data: Date | string;
    status: BancaStatus;
  } | null;
}

export interface TrabalhoWhereInput {
  status?: TrabalhoStatus;
  alunoId?: string;
  orientadorId?: string;
  curso?: string;
  titulo?: {
    contains: string;
    mode?: "insensitive";
  };
}

export type VersionUploadSource =
  | { type: "file"; file: File }
  | { type: "url"; url: string; filename: string };

export interface VersaoDocumentoData {
  numeroVersao: number;
  nomeArquivo: string;
  arquivoUrl: string;
  tamanho: number;
  mimeType: string;
  changelog: string;
  trabalhoId: string;
  uploadPorId: string;
  isExternalLink?: boolean; // Se é link externo ao invés de arquivo uploadado
}

export interface FileUploadResult {
  url: string;
  size: number;
  mimeType: string;
  filename: string;
}

export interface BancaData {
  data: Date | string;
  horario: string;
  local: string;
  link?: string;
  modalidade: ModalidadeBanca;
  trabalhoId: string;
  status?: BancaStatus;
}

export interface MembroBancaData {
  usuarioId: string;
  papel: PapelBanca;
}

export type PrismaWhereInput = Record<string, unknown>;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  code?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface FormProps {
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ListProps<T> {
  items: T[];
  isLoading?: boolean;
  onItemClick?: (item: T) => void;
  onItemEdit?: (item: T) => void;
  onItemDelete?: (item: T) => void;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  nome: string;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Torna todas as propriedades obrigatórias recursivamente
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Tipo para seleção de campos do Prisma
 */
export type PrismaSelect<T> = {
  [K in keyof T]?: boolean | object;
};

/**
 * Tipo para include do Prisma
 */
export type PrismaInclude<T> = {
  [K in keyof T]?: boolean | object;
};

export type { UserRole, TrabalhoStatus, BancaStatus, PapelBanca } from "@prisma/client";
