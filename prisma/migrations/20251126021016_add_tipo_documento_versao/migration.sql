-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('ARQUIVO', 'URL_EXTERNA');

-- AlterTable
ALTER TABLE "versoes_documento" ADD COLUMN     "plataforma" TEXT,
ADD COLUMN     "tipoDocumento" "TipoDocumento" NOT NULL DEFAULT 'ARQUIVO',
ADD COLUMN     "tituloDocumento" TEXT,
ADD COLUMN     "urlExterna" TEXT,
ALTER COLUMN "nomeArquivo" DROP NOT NULL,
ALTER COLUMN "arquivoUrl" DROP NOT NULL,
ALTER COLUMN "tamanho" DROP NOT NULL,
ALTER COLUMN "mimeType" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "versoes_documento_tipoDocumento_idx" ON "versoes_documento"("tipoDocumento");
