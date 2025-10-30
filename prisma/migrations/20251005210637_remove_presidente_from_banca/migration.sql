CREATE TYPE "UserRole" AS ENUM ('ALUNO', 'PROFESSOR', 'COORDENADOR', 'PROFESSOR_BANCA', 'ADMIN');

CREATE TYPE "TrabalhoStatus" AS ENUM ('EM_ELABORACAO', 'SUBMETIDO', 'EM_REVISAO', 'APROVADO_ORIENTADOR', 'AGUARDANDO_BANCA', 'BANCA_AGENDADA', 'APROVADO', 'REPROVADO', 'CANCELADO');

CREATE TYPE "BancaStatus" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA');

CREATE TYPE "PapelBanca" AS ENUM ('ORIENTADOR', 'AVALIADOR', 'SUPLENTE');

CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ALUNO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "matricula" TEXT,
    "curso" TEXT,
    "dataIngresso" TIMESTAMP(3),
    "titulacao" TEXT,
    "departamento" TEXT,
    "areaAtuacao" TEXT,
    "lattes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);


CREATE TABLE "trabalhos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "palavrasChave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "curso" TEXT NOT NULL,
    "status" "TrabalhoStatus" NOT NULL DEFAULT 'EM_ELABORACAO',
    "versaoAtual" INTEGER NOT NULL DEFAULT 0,
    "alunoId" TEXT NOT NULL,
    "orientadorId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSubmissao" TIMESTAMP(3),
    "dataDefesa" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabalhos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "versoes_documento" (
    "id" TEXT NOT NULL,
    "numeroVersao" INTEGER NOT NULL,
    "trabalhoId" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "changelog" TEXT,
    "uploadPorId" TEXT NOT NULL,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "versoes_documento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "versaoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "parentId" TEXT,
    "dataComentario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bancas" (
    "id" TEXT NOT NULL,
    "trabalhoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL DEFAULT 'PRESENCIAL',
    "linkReuniao" TEXT,
    "status" "BancaStatus" NOT NULL DEFAULT 'AGENDADA',
    "notaFinal" DOUBLE PRECISION,
    "resultado" TEXT,
    "ataUrl" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bancas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "membros_banca" (
    "id" TEXT NOT NULL,
    "bancaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "papel" "PapelBanca" NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "membros_banca_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "avaliadoPorId" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "parecer" TEXT NOT NULL,
    "dataAvaliacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "criterios_avaliacao" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "nota" DOUBLE PRECISION NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    CONSTRAINT "criterios_avaliacao_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "detalhes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "configuracoes_sistema" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "configuracoes_sistema_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios" ("email");

CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios" ("cpf");

CREATE UNIQUE INDEX "usuarios_matricula_key" ON "usuarios" ("matricula");

CREATE INDEX "usuarios_email_idx" ON "usuarios" ("email");

CREATE INDEX "usuarios_matricula_idx" ON "usuarios" ("matricula");

CREATE INDEX "usuarios_role_idx" ON "usuarios" ("role");

CREATE INDEX "trabalhos_alunoId_idx" ON "trabalhos" ("alunoId");

CREATE INDEX "trabalhos_orientadorId_idx" ON "trabalhos" ("orientadorId");

CREATE INDEX "trabalhos_status_idx" ON "trabalhos" ("status");

CREATE INDEX "versoes_documento_trabalhoId_idx" ON "versoes_documento" ("trabalhoId");

CREATE UNIQUE INDEX "versoes_documento_trabalhoId_numeroVersao_key" ON "versoes_documento" ("trabalhoId", "numeroVersao");

CREATE INDEX "comentarios_versaoId_idx" ON "comentarios" ("versaoId");

CREATE INDEX "comentarios_autorId_idx" ON "comentarios" ("autorId");

CREATE UNIQUE INDEX "bancas_trabalhoId_key" ON "bancas" ("trabalhoId");

CREATE INDEX "bancas_data_idx" ON "bancas" ("data");

CREATE INDEX "bancas_status_idx" ON "bancas" ("status");

CREATE INDEX "membros_banca_bancaId_idx" ON "membros_banca" ("bancaId");

CREATE INDEX "membros_banca_usuarioId_idx" ON "membros_banca" ("usuarioId");

CREATE UNIQUE INDEX "membros_banca_bancaId_usuarioId_key" ON "membros_banca" ("bancaId", "usuarioId");

CREATE UNIQUE INDEX "avaliacoes_membroId_key" ON "avaliacoes" ("membroId");

CREATE INDEX "avaliacoes_membroId_idx" ON "avaliacoes" ("membroId");

CREATE INDEX "criterios_avaliacao_avaliacaoId_idx" ON "criterios_avaliacao" ("avaliacaoId");

CREATE INDEX "notificacoes_usuarioId_lida_idx" ON "notificacoes" ("usuarioId", "lida");

CREATE INDEX "audit_logs_usuarioId_idx" ON "audit_logs" ("usuarioId");

CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs" ("createdAt");

CREATE UNIQUE INDEX "configuracoes_sistema_chave_key" ON "configuracoes_sistema" ("chave");

ALTER TABLE "trabalhos"
ADD CONSTRAINT "trabalhos_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "trabalhos"
ADD CONSTRAINT "trabalhos_orientadorId_fkey" FOREIGN KEY ("orientadorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "versoes_documento"
ADD CONSTRAINT "versoes_documento_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "versoes_documento"
ADD CONSTRAINT "versoes_documento_uploadPorId_fkey" FOREIGN KEY ("uploadPorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comentarios"
ADD CONSTRAINT "comentarios_versaoId_fkey" FOREIGN KEY ("versaoId") REFERENCES "versoes_documento" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comentarios"
ADD CONSTRAINT "comentarios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "comentarios"
ADD CONSTRAINT "comentarios_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comentarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bancas"
ADD CONSTRAINT "bancas_trabalhoId_fkey" FOREIGN KEY ("trabalhoId") REFERENCES "trabalhos" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membros_banca"
ADD CONSTRAINT "membros_banca_bancaId_fkey" FOREIGN KEY ("bancaId") REFERENCES "bancas" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membros_banca"
ADD CONSTRAINT "membros_banca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "avaliacoes"
ADD CONSTRAINT "avaliacoes_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "membros_banca" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "avaliacoes"
ADD CONSTRAINT "avaliacoes_avaliadoPorId_fkey" FOREIGN KEY ("avaliadoPorId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "criterios_avaliacao"
ADD CONSTRAINT "criterios_avaliacao_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notificacoes"
ADD CONSTRAINT "notificacoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;