import { TrabalhoStatus, UserRole } from "@prisma/client";

/**
 * Máquina de Estados para Trabalhos Acadêmicos
 *
 * Estados:
 * 1. EM_ELABORACAO - Aluno edita e adiciona versões
 * 2. SUBMETIDO - Aluno envia para orientador (bloqueia edição do aluno)
 * 3. EM_REVISAO - Orientador solicita ajustes (retorna controle ao aluno)
 * 4. APROVADO_ORIENTADOR - Orientador aprova (habilita agendamento)
 * 5. AGUARDANDO_BANCA - Aguarda definição de membros pelo coordenador
 * 6. BANCA_AGENDADA - Data e membros definidos
 * 7. APROVADO - Estado final de sucesso
 * 8. REPROVADO - Estado que exige retorno ou encerramento
 * 9. CANCELADO - Estado final administrativo
 */

export type StatusTransition = {
  from: TrabalhoStatus;
  to: TrabalhoStatus;
  allowedRoles: UserRole[];
  requiresBanca?: boolean;
  allowsEditing?: boolean;
};

// Definição das transições válidas
export const VALID_TRANSITIONS: StatusTransition[] = [
  // Aluno submete trabalho
  {
    from: "EM_ELABORACAO",
    to: "SUBMETIDO",
    allowedRoles: ["ALUNO"],
    allowsEditing: false,
  },
  // Orientador solicita revisão
  {
    from: "SUBMETIDO",
    to: "EM_REVISAO",
    allowedRoles: ["PROFESSOR"],
    allowsEditing: true,
  },
  // Orientador aprova diretamente
  {
    from: "SUBMETIDO",
    to: "APROVADO_ORIENTADOR",
    allowedRoles: ["PROFESSOR"],
    allowsEditing: false,
  },
  // Aluno resubmete após revisão
  {
    from: "EM_REVISAO",
    to: "SUBMETIDO",
    allowedRoles: ["ALUNO"],
    allowsEditing: false,
  },
  // Orientador aprova após revisão
  {
    from: "EM_REVISAO",
    to: "APROVADO_ORIENTADOR",
    allowedRoles: ["PROFESSOR"],
    allowsEditing: false,
  },
  // Coordenador agenda banca
  {
    from: "APROVADO_ORIENTADOR",
    to: "AGUARDANDO_BANCA",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    allowsEditing: false,
  },
  // Coordenador define membros e agenda
  {
    from: "AGUARDANDO_BANCA",
    to: "BANCA_AGENDADA",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    requiresBanca: true,
    allowsEditing: false,
  },
  // Banca aprova
  {
    from: "BANCA_AGENDADA",
    to: "APROVADO",
    allowedRoles: ["COORDENADOR", "ADMIN", "PROFESSOR_BANCA"],
    allowsEditing: false,
  },
  // Banca reprova
  {
    from: "BANCA_AGENDADA",
    to: "REPROVADO",
    allowedRoles: ["COORDENADOR", "ADMIN", "PROFESSOR_BANCA"],
    allowsEditing: false,
  },
  // Retorno de reprovado para elaboração (nova tentativa)
  {
    from: "REPROVADO",
    to: "EM_ELABORACAO",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    allowsEditing: true,
  },
  // Cancelamento de qualquer estado (exceto finais)
  {
    from: "EM_ELABORACAO",
    to: "CANCELADO",
    allowedRoles: ["COORDENADOR", "ADMIN", "ALUNO"],
    allowsEditing: false,
  },
  {
    from: "SUBMETIDO",
    to: "CANCELADO",
    allowedRoles: ["COORDENADOR", "ADMIN", "ALUNO"],
    allowsEditing: false,
  },
  {
    from: "EM_REVISAO",
    to: "CANCELADO",
    allowedRoles: ["COORDENADOR", "ADMIN", "ALUNO"],
    allowsEditing: false,
  },
  {
    from: "APROVADO_ORIENTADOR",
    to: "CANCELADO",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    allowsEditing: false,
  },
  {
    from: "AGUARDANDO_BANCA",
    to: "CANCELADO",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    allowsEditing: false,
  },
  {
    from: "BANCA_AGENDADA",
    to: "CANCELADO",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    allowsEditing: false,
  },
  // Reagendamento de banca (ex: cancelamento ou adiamento)
  {
    from: "BANCA_AGENDADA",
    to: "AGUARDANDO_BANCA",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    allowsEditing: false,
  },
  // Banca reprova mas permite revisão (volta para elaboração direto)
  {
    from: "REPROVADO",
    to: "EM_REVISAO",
    allowedRoles: ["COORDENADOR", "ADMIN"],
    allowsEditing: true,
  },
];

// Estados que permitem edição
export const EDITABLE_STATES: TrabalhoStatus[] = ["EM_ELABORACAO", "EM_REVISAO"];

// Estados finais (não podem ser alterados)
export const FINAL_STATES: TrabalhoStatus[] = ["APROVADO", "REPROVADO", "CANCELADO"];

/**
 * Valida se uma transição de estado é permitida
 */
export function canTransition(
  currentStatus: TrabalhoStatus,
  newStatus: TrabalhoStatus,
  userRole: UserRole,
  hasBanca: boolean = false
): { valid: boolean; error?: string } {
  // Não pode sair de estados finais
  if (FINAL_STATES.includes(currentStatus) && currentStatus !== "REPROVADO") {
    return {
      valid: false,
      error: `Não é possível alterar status de trabalho em estado final: ${currentStatus}`,
    };
  }

  // Não há mudança de estado
  if (currentStatus === newStatus) {
    return { valid: true };
  }

  // Busca a transição válida
  const transition = VALID_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === newStatus
  );

  if (!transition) {
    return {
      valid: false,
      error: `Transição inválida de ${currentStatus} para ${newStatus}`,
    };
  }

  // Verifica permissão do usuário
  if (!transition.allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: `Usuário com role ${userRole} não pode realizar esta transição`,
    };
  }

  // Verifica se requer banca agendada
  if (transition.requiresBanca && !hasBanca) {
    return {
      valid: false,
      error: "Esta transição requer uma banca agendada",
    };
  }

  return { valid: true };
}

/**
 * Verifica se o trabalho pode ser editado no estado atual
 */
export function canEditTrabalho(status: TrabalhoStatus): boolean {
  return EDITABLE_STATES.includes(status);
}

/**
 * Verifica se novas versões podem ser enviadas
 */
export function canUploadVersion(
  status: TrabalhoStatus,
  userRole: UserRole,
  isOwner: boolean,
  isOrientador: boolean
): { valid: boolean; error?: string } {
  // Admin e coordenador sempre podem
  if (userRole === "ADMIN" || userRole === "COORDENADOR") {
    return { valid: true };
  }

  // Estados que permitem upload
  const uploadableStates: TrabalhoStatus[] = ["EM_ELABORACAO", "EM_REVISAO"];

  if (!uploadableStates.includes(status)) {
    return {
      valid: false,
      error: `Não é possível enviar versões no estado: ${status}`,
    };
  }

  // Aluno pode enviar apenas em estados editáveis se for o dono
  if (userRole === "ALUNO" && !isOwner) {
    return {
      valid: false,
      error: "Aluno só pode enviar versões dos próprios trabalhos",
    };
  }

  // Orientador pode enviar em qualquer estado se for orientador do trabalho
  if (userRole === "PROFESSOR" && !isOrientador) {
    return {
      valid: false,
      error: "Professor só pode enviar versões de trabalhos que orienta",
    };
  }

  return { valid: true };
}

/**
 * Retorna os próximos estados possíveis baseado no estado atual e role
 */
export function getNextStates(
  currentStatus: TrabalhoStatus,
  userRole: UserRole
): TrabalhoStatus[] {
  return VALID_TRANSITIONS.filter(
    (t) => t.from === currentStatus && t.allowedRoles.includes(userRole)
  ).map((t) => t.to);
}

/**
 * Retorna uma descrição amigável da transição
 */
export function getTransitionDescription(from: TrabalhoStatus, to: TrabalhoStatus): string {
  const descriptions: Record<string, Record<string, string>> = {
    EM_ELABORACAO: {
      SUBMETIDO: "Submeter trabalho para avaliação do orientador",
      CANCELADO: "Cancelar trabalho",
    },
    SUBMETIDO: {
      EM_REVISAO: "Solicitar revisões ao aluno",
      APROVADO_ORIENTADOR: "Aprovar trabalho para defesa",
      CANCELADO: "Cancelar trabalho",
    },
    EM_REVISAO: {
      SUBMETIDO: "Resubmeter trabalho após revisões",
      CANCELADO: "Cancelar trabalho",
    },
    APROVADO_ORIENTADOR: {
      AGUARDANDO_BANCA: "Encaminhar para agendamento de banca",
      CANCELADO: "Cancelar trabalho",
    },
    AGUARDANDO_BANCA: {
      BANCA_AGENDADA: "Agendar banca de defesa",
      CANCELADO: "Cancelar trabalho",
    },
    BANCA_AGENDADA: {
      APROVADO: "Aprovar trabalho na banca",
      REPROVADO: "Reprovar trabalho na banca",
      CANCELADO: "Cancelar banca",
    },
    REPROVADO: {
      EM_ELABORACAO: "Permitir nova tentativa",
    },
  };

  return descriptions[from]?.[to] || `Alterar de ${from} para ${to}`;
}

/**
 * Retorna o label amigável do status
 */
export function getStatusLabel(status: TrabalhoStatus): string {
  const labels: Record<TrabalhoStatus, string> = {
    EM_ELABORACAO: "Em Elaboração",
    SUBMETIDO: "Submetido",
    EM_REVISAO: "Em Revisão",
    APROVADO_ORIENTADOR: "Aprovado pelo Orientador",
    AGUARDANDO_BANCA: "Aguardando Banca",
    BANCA_AGENDADA: "Banca Agendada",
    APROVADO: "Aprovado",
    REPROVADO: "Reprovado",
    CANCELADO: "Cancelado",
  };

  return labels[status] || status;
}

/**
 * Retorna a cor do badge baseado no status
 */
export function getStatusColor(status: TrabalhoStatus): string {
  const colors: Record<TrabalhoStatus, string> = {
    EM_ELABORACAO: "blue",
    SUBMETIDO: "yellow",
    EM_REVISAO: "orange",
    APROVADO_ORIENTADOR: "purple",
    AGUARDANDO_BANCA: "indigo",
    BANCA_AGENDADA: "cyan",
    APROVADO: "green",
    REPROVADO: "red",
    CANCELADO: "gray",
  };

  return colors[status] || "gray";
}
