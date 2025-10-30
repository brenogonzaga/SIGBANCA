// ========================================
// CONFIGURAÇÕES CENTRALIZADAS
// ========================================
// Este arquivo contém APENAS as configurações que estão sendo usadas no código

// ========================================
// FILE_CONFIG - Configurações de Upload
// ========================================
export const FILE_CONFIG = {
  // Tamanho máximo de arquivo em bytes (10MB)
  MAX_SIZE: 10 * 1024 * 1024,

  // Tamanho máximo em MB para exibição
  MAX_SIZE_MB: 10,

  // Tipos de arquivo permitidos (MIME types)
  ALLOWED_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as const,

  // Extensões permitidas
  ALLOWED_EXTENSIONS: [".pdf", ".doc", ".docx"] as const,

  // String para input accept
  ACCEPT_STRING: ".pdf,.doc,.docx",

  // Mensagens de erro
  ERRORS: {
    TOO_LARGE: "Arquivo muito grande. Tamanho máximo: 10MB",
    INVALID_TYPE: "Tipo de arquivo não permitido. Use PDF, DOC ou DOCX",
  },
} as const;

// ========================================
// VALIDATION_CONFIG - Limites de Validação
// ========================================
export const VALIDATION_CONFIG = {
  TRABALHO: {
    TITULO: {
      MIN: 10,
      MAX: 200,
    },
    DESCRICAO: {
      MIN: 50,
      MAX: 2000,
    },
    CURSO: {
      MIN: 3,
      MAX: 100,
    },
  },

  USUARIO: {
    NOME: {
      MIN: 3,
      MAX: 100,
    },
    SENHA: {
      MIN: 6,
      MAX: 100,
    },
  },

  BANCA: {
    MEMBROS: {
      MIN: 2,
    },
    ANTECEDENCIA_MINIMA: 30, // minutos
  },
} as const;

// ========================================
// VALIDATION_MESSAGES - Mensagens de Validação
// ========================================
export const VALIDATION_MESSAGES = {
  TRABALHO: {
    TITULO_REQUIRED: "Título é obrigatório",
    TITULO_MIN: `Título deve ter no mínimo ${VALIDATION_CONFIG.TRABALHO.TITULO.MIN} caracteres`,
    TITULO_MAX: `Título deve ter no máximo ${VALIDATION_CONFIG.TRABALHO.TITULO.MAX} caracteres`,
    DESCRICAO_REQUIRED: "Descrição é obrigatória",
    DESCRICAO_MIN: `Descrição deve ter no mínimo ${VALIDATION_CONFIG.TRABALHO.DESCRICAO.MIN} caracteres`,
    DESCRICAO_MAX: `Descrição deve ter no máximo ${VALIDATION_CONFIG.TRABALHO.DESCRICAO.MAX} caracteres`,
    CURSO_REQUIRED: "Curso é obrigatório",
    CURSO_MIN: `Curso deve ter no mínimo ${VALIDATION_CONFIG.TRABALHO.CURSO.MIN} caracteres`,
    ALUNO_REQUIRED: "Selecione um aluno",
    ORIENTADOR_REQUIRED: "Selecione um orientador",
    ARQUIVO_REQUIRED: "Selecione um arquivo para a primeira versão",
  },

  USUARIO: {
    SENHA_MIN: `Senha deve ter no mínimo ${VALIDATION_CONFIG.USUARIO.SENHA.MIN} caracteres`,
  },

  BANCA: {
    DATA_PASSADA: "Data não pode ser no passado",
    LINK_REQUIRED: "Link é obrigatório para bancas remotas ou híbridas",
    LINK_INVALID: "Link inválido. Use uma URL válida (ex: https://meet.google.com/...)",
    TRABALHO_REQUIRED: "Selecione um trabalho",
    MEMBROS_MIN: `Adicione pelo menos ${VALIDATION_CONFIG.BANCA.MEMBROS.MIN} membros à banca`,
    MEMBRO_DUPLICADO: "Não é possível adicionar o mesmo professor mais de uma vez",
    ANTECEDENCIA_MINIMA: `A banca deve ser agendada com pelo menos ${VALIDATION_CONFIG.BANCA.ANTECEDENCIA_MINIMA} minutos de antecedência`,
  },

  COMENTARIO: {
    TEXTO_REQUIRED: "Digite um comentário",
  },
} as const;

// ========================================
// FUNÇÕES DE VALIDAÇÃO
// ========================================

/**
 * Valida se um arquivo está dentro dos limites permitidos
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > FILE_CONFIG.MAX_SIZE) {
    return { valid: false, error: FILE_CONFIG.ERRORS.TOO_LARGE };
  }
  return { valid: true };
}

/**
 * Valida se um tipo de arquivo é permitido
 */
export function validateFileType(type: string): { valid: boolean; error?: string } {
  if (!FILE_CONFIG.ALLOWED_TYPES.includes(type as (typeof FILE_CONFIG.ALLOWED_TYPES)[number])) {
    return { valid: false, error: FILE_CONFIG.ERRORS.INVALID_TYPE };
  }
  return { valid: true };
}

// ========================================
// EXPORT DEFAULT
// ========================================
const config = {
  FILE: FILE_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  MESSAGES: VALIDATION_MESSAGES,
  utils: {
    validateFileSize,
    validateFileType,
  },
};

export default config;
