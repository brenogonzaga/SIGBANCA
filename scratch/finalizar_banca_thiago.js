const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalizeBanca() {
  // 1. Encontrar o trabalho do Thiago
  const trabalho = await prisma.trabalho.findFirst({
    where: { aluno: { nome: "Thiago Lima Santos" } },
    include: { banca: { include: { membros: true } } }
  });

  if (!trabalho || !trabalho.banca) {
    console.error("Trabalho ou Banca não encontrados para o Thiago.");
    return;
  }

  const bancaId = trabalho.banca.id;
  console.log(`Finalizando banca ${bancaId} do aluno Thiago Lima Santos...`);

  // 2. Criar avaliações para todos os membros que ainda não avaliaram
  for (const membro of trabalho.banca.membros) {
    const avaliacaoExistente = await prisma.avaliacao.findFirst({
      where: { membroId: membro.id }
    });

    if (!avaliacaoExistente) {
      await prisma.avaliacao.create({
        data: {
          membroId: membro.id,
          avaliadoPorId: membro.usuarioId,
          nota: 10,
          parecer: "Trabalho excelente, atende a todos os requisitos institucionais do IFAM."
        }
      });
      console.log(`- Avaliação registrada para o membro ${membro.id}`);
    }
  }

  // 3. Atualizar a banca para REALIZADA
  await prisma.banca.update({
    where: { id: bancaId },
    data: {
      status: "REALIZADA",
      notaFinal: 10,
      resultado: "APROVADO",
      data: new Date() // Garantir que a data é hoje para o teste
    }
  });

  // 4. Atualizar o status do trabalho
  await prisma.trabalho.update({
    where: { id: trabalho.id },
    data: { status: "APROVADO" }
  });

  console.log("=== BANCA FINALIZADA COM SUCESSO! ===");
}

finalizeBanca()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
