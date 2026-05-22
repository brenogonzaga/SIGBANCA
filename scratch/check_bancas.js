const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log("=== TRABALHOS NO SISTEMA ===");
  const trabalhos = await prisma.trabalho.findMany({
    include: { 
      aluno: true,
      banca: true 
    }
  });

  trabalhos.forEach(t => {
    console.log(`- Título: ${t.titulo}`);
    console.log(`  Aluno: ${t.aluno.nome}`);
    console.log(`  Status Trabalho: ${t.status}`);
    console.log(`  Possui Banca? ${t.banca ? 'SIM' : 'NÃO'}`);
    if (t.banca) {
      console.log(`  Status Banca: ${t.banca.status}`);
    }
    console.log("----------------------------");
  });
}

checkData()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
