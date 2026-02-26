export type UserRole = "ALUNO" | "PROFESSOR" | "COORDENADOR" | "PROFESSOR_BANCA" | "ADMIN";

export type TrabalhoStatus =
  | "EM_ELABORACAO"
  | "SUBMETIDO"
  | "EM_REVISAO"
  | "APROVADO_ORIENTADOR"
  | "AGUARDANDO_BANCA"
  | "BANCA_AGENDADA"
  | "APROVADO"
  | "REPROVADO"
  | "CANCELADO";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  curso?: string;
  matricula?: string;
  createdAt: Date;
}

export interface Trabalho {
  id: string;
  titulo: string;
  aluno: Usuario;
  orientador: Usuario;
  curso: string;
  descricao: string;
  status: TrabalhoStatus;
  dataCriacao: Date;
  dataSubmissao?: Date;
  versaoAtual: number;
  versoes: VersaoDocumento[];
  banca?: Banca;
  createdAt: Date;
  updatedAt: Date;
}

export type TipoDocumento = "ARQUIVO" | "URL_EXTERNA";

export type PlataformaExterna =
  | "google_docs"
  | "google_drive"
  | "onedrive"
  | "dropbox"
  | "overleaf"
  | "notion"
  | "outro";

export interface VersaoDocumento {
  id: string;
  trabalhoId: string;
  numeroVersao: number;
  tipoDocumento: TipoDocumento;
  // Campos para ARQUIVO
  arquivoUrl?: string;
  nomeArquivo?: string;
  tamanho?: number;
  mimeType?: string;
  // Campos para URL_EXTERNA
  urlExterna?: string;
  plataforma?: PlataformaExterna;
  tituloDocumento?: string;
  // Campos comuns
  dataUpload: Date;
  uploadPor: Usuario;
  comentarios: Comentario[];
  changelog?: string;
}

export interface Banca {
  id: string;
  trabalhoId: string;
  data: Date;
  horario: string;
  local: string;
  modalidade: "PRESENCIAL" | "REMOTO" | "HIBRIDO";
  linkReuniao?: string;
  membros: MembroBanca[];
  status: "AGENDADA" | "EM_ANDAMENTO" | "REALIZADA" | "CANCELADA";
  notaFinal?: number;
  resultado?: "APROVADO" | "APROVADO_COM_RESSALVAS" | "REPROVADO";
  ataUrl?: string;
  observacoes?: string;
}

export interface MembroBanca {
  id: string;
  usuario: Usuario;
  papel: "ORIENTADOR" | "AVALIADOR" | "SUPLENTE";
  avaliacao?: Avaliacao;
}

export interface Avaliacao {
  id: string;
  membroId: string;
  nota: number;
  parecer: string;
  dataAvaliacao: Date;
  criterios: CriterioAvaliacao[];
}

export interface CriterioAvaliacao {
  id: string;
  nome: string;
  descricao: string;
  nota: number;
  peso: number;
}

export interface Comentario {
  id: string;
  versaoId: string;
  autor: Usuario;
  texto: string;
  dataComentario: Date;
  parentId?: string | null;
  respostas?: Comentario[];
}

export interface DashboardStats {
  totalTrabalhos: number;
  trabalhosEmElaboracao: number;
  trabalhosSubmetidos: number;
  trabalhosAprovados: number;
  bancasAgendadas: number;
  bancasRealizadas: number;
  distribuicaoPorCurso: { curso: string; quantidade: number }[];
  temasFrequentes: { tema: string; quantidade: number }[];
  mediaTempoPorEtapa: { etapa: string; dias: number }[];
}
