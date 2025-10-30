export type UserRole = "aluno" | "professor" | "coordenador";

export type TrabalhoStatus =
  | "em_elaboracao"
  | "submetido"
  | "em_revisao"
  | "aprovado"
  | "reprovado";

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
}

export interface VersaoDocumento {
  id: string;
  trabalhoId: string;
  numeroVersao: number;
  arquivoUrl: string;
  nomeArquivo: string;
  tamanho: number;
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
  membros: MembroBanca[];
  status: "agendada" | "realizada" | "cancelada";
  ataUrl?: string;
}

export interface MembroBanca {
  id: string;
  usuario: Usuario;
  papel: "orientador" | "avaliador" | "suplente";
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
  respondidoPor?: Comentario[];
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
