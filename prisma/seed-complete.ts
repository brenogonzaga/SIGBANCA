import "dotenv/config";
import { prisma } from "../app/lib/prisma";
import { hashPassword } from "../app/lib/auth";

async function main() {
  console.log("🌱 Iniciando seed completo do banco de dados...");

  // Limpar dados existentes (cuidado em produção!)
  await prisma.auditLog.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.membroBanca.deleteMany();
  await prisma.banca.deleteMany();
  await prisma.comentario.deleteMany();
  await prisma.versaoDocumento.deleteMany();
  await prisma.trabalho.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("✅ Dados antigos removidos");

  // Criar usuários de exemplo
  const senhaHash = await hashPassword("senha123");

  // ========== ADMINISTRADORES ==========
  const admin1 = await prisma.usuario.create({
    data: {
      email: "admin@ifam.edu.br",
      senha: senhaHash,
      nome: "Administrador Geral",
      role: "ADMIN",
      cpf: "111.111.111-11",
      telefone: "(92) 99999-0001",
      ativo: true,
    },
  });

  await prisma.usuario.create({
    data: {
      email: "admin2@ifam.edu.br",
      senha: senhaHash,
      nome: "Suporte Técnico",
      role: "ADMIN",
      cpf: "112.112.112-12",
      telefone: "(92) 99999-0002",
      ativo: true,
    },
  });

  // ========== COORDENADORES ==========
  const coordenador1 = await prisma.usuario.create({
    data: {
      email: "coordenador@ifam.edu.br",
      senha: senhaHash,
      nome: "Carlos Eduardo Silva",
      role: "COORDENADOR",
      cpf: "222.222.222-22",
      telefone: "(92) 99999-1001",
      titulacao: "Dr.",
      departamento: "Departamento de Informática",
      areaAtuacao: "Engenharia de Software",
      lattes: "http://lattes.cnpq.br/1111111111",
      ativo: true,
    },
  });

  await prisma.usuario.create({
    data: {
      email: "coord.ti@ifam.edu.br",
      senha: senhaHash,
      nome: "Mariana Costa Santos",
      role: "COORDENADOR",
      cpf: "223.223.223-23",
      telefone: "(92) 99999-1002",
      titulacao: "Dra.",
      departamento: "Departamento de Tecnologia da Informação",
      areaAtuacao: "Gestão de TI",
      lattes: "http://lattes.cnpq.br/2222222222",
      ativo: true,
    },
  });

  // ========== PROFESSORES ORIENTADORES ==========
  const professores = await Promise.all([
    prisma.usuario.create({
      data: {
        email: "maria.santos@ifam.edu.br",
        senha: senhaHash,
        nome: "Maria Fernanda Santos",
        role: "PROFESSOR",
        cpf: "333.333.333-33",
        telefone: "(92) 99999-2001",
        titulacao: "Dra.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Inteligência Artificial e Machine Learning",
        lattes: "http://lattes.cnpq.br/3333333333",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "joao.oliveira@ifam.edu.br",
        senha: senhaHash,
        nome: "João Pedro Oliveira",
        role: "PROFESSOR",
        cpf: "334.334.334-34",
        telefone: "(92) 99999-2002",
        titulacao: "Dr.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Banco de Dados e Big Data",
        lattes: "http://lattes.cnpq.br/4444444444",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "ana.rodrigues@ifam.edu.br",
        senha: senhaHash,
        nome: "Ana Paula Rodrigues",
        role: "PROFESSOR",
        cpf: "335.335.335-35",
        telefone: "(92) 99999-2003",
        titulacao: "Dra.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Desenvolvimento Web e Mobile",
        lattes: "http://lattes.cnpq.br/5555555555",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "ricardo.silva@ifam.edu.br",
        senha: senhaHash,
        nome: "Ricardo Almeida Silva",
        role: "PROFESSOR",
        cpf: "336.336.336-36",
        telefone: "(92) 99999-2004",
        titulacao: "Dr.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Sistemas Distribuídos e Cloud Computing",
        lattes: "http://lattes.cnpq.br/6666666666",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "fernanda.lima@ifam.edu.br",
        senha: senhaHash,
        nome: "Fernanda Maria Lima",
        role: "PROFESSOR",
        cpf: "337.337.337-37",
        telefone: "(92) 99999-2005",
        titulacao: "Dra.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Engenharia de Software e DevOps",
        lattes: "http://lattes.cnpq.br/7777777777",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "paulo.mendes@ifam.edu.br",
        senha: senhaHash,
        nome: "Paulo César Mendes",
        role: "PROFESSOR",
        cpf: "338.338.338-38",
        telefone: "(92) 99999-2006",
        titulacao: "Dr.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Segurança da Informação",
        lattes: "http://lattes.cnpq.br/8888888888",
        ativo: true,
      },
    }),
  ]);

  // ========== PROFESSORES DE BANCA ==========
  const professoresBanca = await Promise.all([
    prisma.usuario.create({
      data: {
        email: "pedro.costa@ifam.edu.br",
        senha: senhaHash,
        nome: "Pedro Henrique Costa",
        role: "PROFESSOR_BANCA",
        cpf: "441.441.441-41",
        telefone: "(92) 99999-3001",
        titulacao: "Dr.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Redes de Computadores e IoT",
        lattes: "http://lattes.cnpq.br/9999999991",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "ana.lima@ifam.edu.br",
        senha: senhaHash,
        nome: "Ana Carolina Lima",
        role: "PROFESSOR_BANCA",
        cpf: "442.442.442-42",
        telefone: "(92) 99999-3002",
        titulacao: "Dra.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Segurança da Informação e Criptografia",
        lattes: "http://lattes.cnpq.br/9999999992",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "roberto.santos@ifam.edu.br",
        senha: senhaHash,
        nome: "Roberto Carlos Santos",
        role: "PROFESSOR_BANCA",
        cpf: "443.443.443-43",
        telefone: "(92) 99999-3003",
        titulacao: "Dr.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Computação Gráfica e Visão Computacional",
        lattes: "http://lattes.cnpq.br/9999999993",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "juliana.sousa@ifam.edu.br",
        senha: senhaHash,
        nome: "Juliana Sousa Martins",
        role: "PROFESSOR_BANCA",
        cpf: "444.444.444-44",
        telefone: "(92) 99999-3004",
        titulacao: "Dra.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Interação Humano-Computador",
        lattes: "http://lattes.cnpq.br/9999999994",
        ativo: true,
      },
    }),
    prisma.usuario.create({
      data: {
        email: "marcos.pereira@ifam.edu.br",
        senha: senhaHash,
        nome: "Marcos Vinícius Pereira",
        role: "PROFESSOR_BANCA",
        cpf: "445.445.445-45",
        telefone: "(92) 99999-3005",
        titulacao: "Dr.",
        departamento: "Departamento de Informática",
        areaAtuacao: "Arquitetura de Software",
        lattes: "http://lattes.cnpq.br/9999999995",
        ativo: true,
      },
    }),
  ]);

  // ========== ALUNOS ==========
  const cursos = [
    "Análise e Desenvolvimento de Sistemas",
    "Sistemas de Informação",
    "Ciência da Computação",
    "Engenharia de Software",
  ];

  const nomesAlunos = [
    { nome: "Breno Oliveira Santos", email: "breno.santos" },
    { nome: "Juliana Ferreira Costa", email: "juliana.costa" },
    { nome: "Rafael Souza Lima", email: "rafael.lima" },
    { nome: "Camila Alves Pereira", email: "camila.pereira" },
    { nome: "Lucas Martins Silva", email: "lucas.silva" },
    { nome: "Amanda Rodrigues Souza", email: "amanda.souza" },
    { nome: "Felipe Santos Almeida", email: "felipe.almeida" },
    { nome: "Beatriz Costa Oliveira", email: "beatriz.oliveira" },
    { nome: "Thiago Lima Santos", email: "thiago.santos" },
    { nome: "Larissa Fernandes Costa", email: "larissa.costa" },
    { nome: "Gabriel Souza Rodrigues", email: "gabriel.rodrigues" },
    { nome: "Mariana Silva Alves", email: "mariana.alves" },
    { nome: "Diego Pereira Lima", email: "diego.lima" },
    { nome: "Isabela Santos Martins", email: "isabela.martins" },
    { nome: "Vinícius Costa Silva", email: "vinicius.silva" },
    { nome: "Carolina Almeida Santos", email: "carolina.santos" },
    { nome: "Rodrigo Oliveira Costa", email: "rodrigo.costa" },
    { nome: "Patrícia Lima Souza", email: "patricia.souza" },
    { nome: "Bruno Silva Pereira", email: "bruno.pereira" },
    { nome: "Natália Santos Costa", email: "natalia.costa" },
  ];

  const alunos = await Promise.all(
    nomesAlunos.map((aluno, index) =>
      prisma.usuario.create({
        data: {
          email: `${aluno.email}@edu.ifam.edu.br`,
          senha: senhaHash,
          nome: aluno.nome,
          role: "ALUNO",
          cpf: `${500 + index}.${500 + index}.${500 + index}-${(index % 90) + 10}`,
          telefone: `(92) 99${String(index + 100).padStart(3, "0")}-${String(
            (index + 1) * 111,
          ).slice(-4)}`,
          matricula: `${2020 + (index % 5)}${String(index + 1).padStart(3, "0")}`,
          curso: cursos[index % cursos.length],
          dataIngresso: new Date(`${2020 + (index % 5)}-03-01`),
          ativo: true,
        },
      }),
    ),
  );

  console.log(`✅ Criados ${alunos.length} alunos com trabalhos`);

  // ========== ALUNOS SEM TRABALHOS ==========
  const nomesAlunosSemTrabalho = [
    { nome: "Gustavo Ferreira Alves", email: "gustavo.alves" },
    { nome: "Melissa Costa Ribeiro", email: "melissa.ribeiro" },
    { nome: "Henrique Santos Barbosa", email: "henrique.barbosa" },
    { nome: "Valentina Lima Cardoso", email: "valentina.cardoso" },
    { nome: "Arthur Oliveira Dias", email: "arthur.dias" },
    { nome: "Sophia Rodrigues Moreira", email: "sophia.moreira" },
    { nome: "Pedro Henrique Souza", email: "pedro.souza" },
    { nome: "Alice Pereira Gomes", email: "alice.gomes" },
    { nome: "Miguel Santos Correia", email: "miguel.correia" },
    { nome: "Helena Costa Nunes", email: "helena.nunes" },
    { nome: "Davi Lima Monteiro", email: "davi.monteiro" },
    { nome: "Laura Alves Teixeira", email: "laura.teixeira" },
    { nome: "Enzo Silva Carvalho", email: "enzo.carvalho" },
    { nome: "Manuela Ferreira Pinto", email: "manuela.pinto" },
    { nome: "Bernardo Costa Araujo", email: "bernardo.araujo" },
  ];

  const alunosSemTrabalho = await Promise.all(
    nomesAlunosSemTrabalho.map((aluno, index) =>
      prisma.usuario.create({
        data: {
          email: `${aluno.email}@edu.ifam.edu.br`,
          senha: senhaHash,
          nome: aluno.nome,
          role: "ALUNO",
          cpf: `${600 + index}.${600 + index}.${600 + index}-${(index % 90) + 10}`,
          telefone: `(92) 99${String(index + 200).padStart(3, "0")}-${String(
            (index + 1) * 123,
          ).slice(-4)}`,
          matricula: `${2021 + (index % 4)}${String(index + 100).padStart(3, "0")}`,
          curso: cursos[index % cursos.length],
          dataIngresso: new Date(`${2021 + (index % 4)}-03-01`),
          ativo: true,
        },
      }),
    ),
  );

  console.log(`✅ Criados ${alunosSemTrabalho.length} alunos sem trabalhos`);

  // ========== TRABALHOS COM DIVERSIDADE ==========
  const titulosTrabalhos = [
    {
      titulo: "Sistema de Gerenciamento de Bancas Acadêmicas com IA",
      descricao:
        "Desenvolvimento de um sistema web para gerenciamento automatizado de trabalhos de conclusão de curso e bancas examinadoras, utilizando inteligência artificial para sugestão de avaliadores.",
      palavrasChave: ["Gerenciamento", "TCC", "Bancas", "IA", "Web"],
      status: "EM_REVISAO",
    },
    {
      titulo: "Aplicativo Mobile para Gestão de Estoque com IoT",
      descricao:
        "Aplicativo mobile integrado com sensores IoT para controle inteligente de estoque em pequenas empresas.",
      palavrasChave: ["Mobile", "Estoque", "IoT", "React Native", "Sensores"],
      status: "APROVADO_ORIENTADOR",
    },
    {
      titulo: "Sistema de Recomendação de Produtos com Machine Learning",
      descricao:
        "Implementação de um sistema de recomendação utilizando algoritmos de aprendizado de máquina e análise colaborativa.",
      palavrasChave: ["Machine Learning", "IA", "Recomendação", "Python", "TensorFlow"],
      status: "BANCA_AGENDADA",
    },
    {
      titulo: "Plataforma de E-commerce com Microserviços",
      descricao:
        "Desenvolvimento de plataforma de comércio eletrônico utilizando arquitetura de microserviços e containers Docker.",
      palavrasChave: ["E-commerce", "Microserviços", "Docker", "Kubernetes", "Node.js"],
      status: "EM_ELABORACAO",
    },
    {
      titulo: "Sistema de Monitoramento de Saúde com Wearables",
      descricao:
        "Aplicação para monitoramento contínuo de saúde integrando dispositivos vestíveis e análise de dados em tempo real.",
      palavrasChave: ["Saúde", "Wearables", "IoT", "Real-time", "Mobile"],
      status: "SUBMETIDO",
    },
    {
      titulo: "Chatbot Inteligente para Atendimento ao Cliente",
      descricao:
        "Desenvolvimento de chatbot com processamento de linguagem natural para atendimento automatizado ao cliente.",
      palavrasChave: ["Chatbot", "NLP", "IA", "Atendimento", "Python"],
      status: "EM_REVISAO",
    },
    {
      titulo: "Sistema de Detecção de Fraudes em Transações Bancárias",
      descricao:
        "Implementação de sistema de detecção de fraudes utilizando machine learning e análise de padrões.",
      palavrasChave: ["Segurança", "Fraude", "Machine Learning", "Análise", "Fintech"],
      status: "APROVADO_ORIENTADOR",
    },
    {
      titulo: "Plataforma de Ensino Adaptativo com IA",
      descricao:
        "Plataforma educacional que adapta conteúdo e metodologia baseado no perfil de aprendizagem do aluno.",
      palavrasChave: ["Educação", "IA", "Adaptativo", "E-learning", "Personalização"],
      status: "AGUARDANDO_BANCA",
    },
    {
      titulo: "Sistema de Gestão de Energia Inteligente para Smart Cities",
      descricao:
        "Solução para otimização do consumo de energia em cidades inteligentes usando IoT e análise preditiva.",
      palavrasChave: ["Smart City", "IoT", "Energia", "Sustentabilidade", "Big Data"],
      status: "BANCA_AGENDADA",
    },
    {
      titulo: "Aplicação de Realidade Aumentada para Educação",
      descricao:
        "Desenvolvimento de aplicação educacional utilizando realidade aumentada para ensino de ciências.",
      palavrasChave: ["AR", "Educação", "Mobile", "Unity", "3D"],
      status: "EM_ELABORACAO",
    },
    {
      titulo: "Sistema de Reconhecimento Facial para Controle de Acesso",
      descricao:
        "Implementação de sistema de controle de acesso utilizando reconhecimento facial e deep learning.",
      palavrasChave: ["Visão Computacional", "Deep Learning", "Segurança", "OpenCV", "Python"],
      status: "APROVADO",
    },
    {
      titulo: "Plataforma de Crowdfunding com Blockchain",
      descricao:
        "Desenvolvimento de plataforma de financiamento coletivo utilizando blockchain para transparência e segurança.",
      palavrasChave: ["Blockchain", "Crowdfunding", "Web3", "Smart Contracts", "Ethereum"],
      status: "EM_REVISAO",
    },
    {
      titulo: "Sistema de Análise de Sentimentos em Redes Sociais",
      descricao:
        "Ferramenta para análise de sentimentos e tendências em redes sociais utilizando NLP.",
      palavrasChave: ["NLP", "Sentimentos", "Redes Sociais", "Analytics", "Python"],
      status: "SUBMETIDO",
    },
    {
      titulo: "Aplicativo de Carona Solidária Sustentável",
      descricao:
        "Aplicativo mobile para compartilhamento de caronas com foco em sustentabilidade e redução de emissões.",
      palavrasChave: ["Mobile", "Sustentabilidade", "Carona", "Geolocalização", "React Native"],
      status: "APROVADO_ORIENTADOR",
    },
    {
      titulo: "Sistema de Gestão Hospitalar com Telemedicina",
      descricao:
        "Plataforma integrada para gestão hospitalar incluindo módulo de telemedicina e prontuário eletrônico.",
      palavrasChave: ["Saúde", "Telemedicina", "Gestão", "Web", "API"],
      status: "AGUARDANDO_BANCA",
    },
  ];

  const trabalhos = await Promise.all(
    titulosTrabalhos.map(async (trabalho, index) => {
      const aluno = alunos[index % alunos.length];
      const orientador = professores[index % professores.length];

      return prisma.trabalho.create({
        data: {
          titulo: trabalho.titulo,
          descricao: trabalho.descricao,
          alunoId: aluno.id,
          orientadorId: orientador.id,
          status: trabalho.status as
            | "EM_ELABORACAO"
            | "SUBMETIDO"
            | "EM_REVISAO"
            | "APROVADO_ORIENTADOR"
            | "AGUARDANDO_BANCA"
            | "BANCA_AGENDADA"
            | "APROVADO"
            | "REPROVADO"
            | "CANCELADO",
          curso: aluno.curso!,
          palavrasChave: trabalho.palavrasChave,
        },
      });
    }),
  );

  console.log(`✅ Criados ${trabalhos.length} trabalhos`);

  // ========== VERSÕES DE DOCUMENTOS ==========
  for (let i = 0; i < trabalhos.length; i++) {
    const trabalho = trabalhos[i];
    const aluno = alunos[i % alunos.length];
    const numVersoes = Math.floor(Math.random() * 3) + 1; // 1 a 3 versões

    for (let v = 1; v <= numVersoes; v++) {
      // Alternar entre ARQUIVO e URL_EXTERNA para demonstração
      const usarUrlExterna = v > 1 && Math.random() > 0.7; // 30% chance de URL externa após v1

      if (usarUrlExterna) {
        const plataformas = ["google_docs", "google_drive", "onedrive", "overleaf"] as const;
        const plataforma = plataformas[Math.floor(Math.random() * plataformas.length)];
        const urls: Record<string, string> = {
          google_docs: "https://docs.google.com/document/d/1abc123xyz",
          google_drive: "https://drive.google.com/file/d/1abc123xyz",
          onedrive: "https://onedrive.live.com/view.aspx?id=abc123",
          overleaf: "https://www.overleaf.com/project/abc123xyz",
        };

        await prisma.versaoDocumento.create({
          data: {
            trabalhoId: trabalho.id,
            uploadPorId: aluno.id,
            numeroVersao: v,
            tipoDocumento: "URL_EXTERNA",
            urlExterna: urls[plataforma],
            plataforma: plataforma,
            tituloDocumento: `TCC ${aluno.nome} - Versão ${v}`,
            changelog: `Versão ${v} - Documento compartilhado via ${plataforma.replace("_", " ")}`,
          },
        });
      } else {
        await prisma.versaoDocumento.create({
          data: {
            trabalhoId: trabalho.id,
            uploadPorId: aluno.id,
            numeroVersao: v,
            tipoDocumento: "ARQUIVO",
            nomeArquivo: `tcc_v${v}_${aluno.nome.toLowerCase().replace(/\s+/g, "_")}.pdf`,
            arquivoUrl: `/uploads/trabalhos/${trabalho.id}/v${v}/documento.pdf`,
            tamanho: Math.floor(Math.random() * 2000000) + 500000, // 500KB a 2.5MB
            mimeType: "application/pdf",
            changelog:
              v === 1 ? "Versão inicial do TCC" : `Versão ${v} - Correções e melhorias`,
          },
        });
      }
    }
  }

  console.log("✅ Versões de documentos criadas");

  // ========== BANCAS ==========
  const bancas = [];
  const trabalhosBancaAgendada = trabalhos.filter((t) =>
    ["BANCA_AGENDADA", "AGUARDANDO_BANCA"].includes(t.status),
  );

  for (const trabalho of trabalhosBancaAgendada) {
    const dataBase = new Date("2025-02-01");
    dataBase.setDate(dataBase.getDate() + Math.floor(Math.random() * 60)); // Próximos 60 dias

    // Obter o orientador do trabalho
    const trabalhoCompleto = await prisma.trabalho.findUnique({
      where: { id: trabalho.id },
      select: { orientadorId: true },
    });

    const banca = await prisma.banca.create({
      data: {
        trabalhoId: trabalho.id,
        data: dataBase,
        horario: ["08:00", "10:00", "14:00", "16:00"][Math.floor(Math.random() * 4)],
        local: [
          "Sala de Defesas - Campus Manaus Centro",
          "Auditório Principal - Campus Distrito Industrial",
          "Laboratório de Informática - Campus Manaus Zona Leste",
          "Sala de Videoconferência - Campus Centro",
        ][Math.floor(Math.random() * 4)],
        modalidade: Math.random() > 0.3 ? "PRESENCIAL" : "REMOTO",
        status: "AGENDADA",
        observacoes: "Banca de TCC - Defesa pública",
        linkReuniao: Math.random() > 0.3 ? undefined : "https://meet.google.com/xxx-yyyy-zzz",
      },
    });

    bancas.push(banca);

    // Adicionar 1 ORIENTADOR (obrigatório)
    await prisma.membroBanca.create({
      data: {
        bancaId: banca.id,
        usuarioId: trabalhoCompleto!.orientadorId,
        papel: "ORIENTADOR",
        confirmado: true,
        presente: false,
      },
    });

    // Adicionar 2 ou mais AVALIADORES (no mínimo 2)
    const numAvaliadores = Math.floor(Math.random() * 2) + 2; // 2 ou 3 avaliadores
    const avaliadoresAdicionados = new Set<string>([trabalhoCompleto!.orientadorId]);

    for (let i = 0; i < numAvaliadores; i++) {
      let avaliador = professoresBanca[Math.floor(Math.random() * professoresBanca.length)];

      // Garantir que não seja o orientador
      let tentativas = 0;
      while (avaliadoresAdicionados.has(avaliador.id) && tentativas < 20) {
        avaliador = professoresBanca[Math.floor(Math.random() * professoresBanca.length)];
        tentativas++;
      }

      if (!avaliadoresAdicionados.has(avaliador.id)) {
        avaliadoresAdicionados.add(avaliador.id);
        await prisma.membroBanca.create({
          data: {
            bancaId: banca.id,
            usuarioId: avaliador.id,
            papel: "AVALIADOR",
            confirmado: Math.random() > 0.2, // 80% confirmados
            presente: false,
          },
        });
      }
    }
  }

  console.log(`✅ Criadas ${bancas.length} bancas`);

  // ========== COMENTÁRIOS ==========
  const versoesComComentarios = await prisma.versaoDocumento.findMany({
    take: 10,
    include: { trabalho: { include: { orientador: true, aluno: true } } },
  });

  for (const versao of versoesComComentarios) {
    const numComentarios = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numComentarios; i++) {
      await prisma.comentario.create({
        data: {
          versaoId: versao.id,
          autorId: versao.trabalho.orientador.id,
          texto: [
            "Excelente desenvolvimento do tema. Sugiro aprofundar a metodologia.",
            "A revisão bibliográfica está bem fundamentada. Continue assim!",
            "Necessário incluir mais referências recentes sobre o tema.",
            "Os resultados estão bem apresentados, mas falta análise crítica.",
            "Atenção à formatação das citações conforme ABNT.",
          ][Math.floor(Math.random() * 5)],
        },
      });
    }
  }

  console.log("✅ Comentários criados");

  // ========== NOTIFICAÇÕES ==========
  for (const aluno of alunos.slice(0, 10)) {
    await prisma.notificacao.create({
      data: {
        usuarioId: aluno.id,
        tipo: "TRABALHO",
        titulo: "Novo comentário no seu TCC",
        mensagem: "Seu orientador adicionou um comentário na última versão do trabalho.",
        lida: Math.random() > 0.5,
      },
    });
  }

  console.log("✅ Notificações criadas");

  // ========== CONFIGURAÇÕES DO SISTEMA ==========
  await Promise.all([
    prisma.configuracaoSistema.upsert({
      where: { chave: "prazo_minimo_agendamento" },
      update: { valor: "15", descricao: "Prazo mínimo em dias para agendamento de banca" },
      create: {
        chave: "prazo_minimo_agendamento",
        valor: "15",
        descricao: "Prazo mínimo em dias para agendamento de banca",
      },
    }),
    prisma.configuracaoSistema.upsert({
      where: { chave: "duracao_default_banca" },
      update: { valor: "120", descricao: "Duração padrão de uma banca em minutos" },
      create: {
        chave: "duracao_default_banca",
        valor: "120",
        descricao: "Duração padrão de uma banca em minutos",
      },
    }),
    prisma.configuracaoSistema.upsert({
      where: { chave: "tamanho_maximo_arquivo" },
      update: { valor: "10485760", descricao: "Tamanho máximo de arquivo em bytes (10MB)" },
      create: {
        chave: "tamanho_maximo_arquivo",
        valor: "10485760",
        descricao: "Tamanho máximo de arquivo em bytes (10MB)",
      },
    }),
    prisma.configuracaoSistema.upsert({
      where: { chave: "emails_notificacao" },
      update: { valor: "true", descricao: "Enviar notificações por email" },
      create: {
        chave: "emails_notificacao",
        valor: "true",
        descricao: "Enviar notificações por email",
      },
    }),
  ]);

  console.log("✅ Configurações do sistema criadas");

  // ========== AUDIT LOGS ==========
  await Promise.all([
    prisma.auditLog.create({
      data: {
        usuarioId: admin1.id,
        acao: "LOGIN",
        entidade: "Usuario",
        detalhes: { descricao: "Login realizado no sistema" },
      },
    }),
    prisma.auditLog.create({
      data: {
        usuarioId: coordenador1.id,
        acao: "CREATE",
        entidade: "Trabalho",
        detalhes: { descricao: "Novo trabalho cadastrado no sistema" },
      },
    }),
  ]);

  console.log("✅ Audit logs criados");

  console.log("\n🎉 Seed completo concluído com sucesso!\n");
  console.log("📊 Resumo dos dados criados:");
  console.log(`   - ${2} Administradores`);
  console.log(`   - ${2} Coordenadores`);
  console.log(`   - ${professores.length} Professores Orientadores`);
  console.log(`   - ${professoresBanca.length} Professores de Banca`);
  console.log(`   - ${alunos.length} Alunos com trabalhos`);
  console.log(`   - ${alunosSemTrabalho.length} Alunos sem trabalhos`);
  console.log(`   - ${trabalhos.length} Trabalhos de Conclusão`);
  console.log(`   - ${bancas.length} Bancas Agendadas`);
  console.log("\n📧 Credenciais de acesso (todos com senha: senha123):");
  console.log("   Admin: admin@ifam.edu.br");
  console.log("   Admin 2: admin2@ifam.edu.br");
  console.log("   Coordenador: coordenador@ifam.edu.br");
  console.log("   Coordenador 2: coord.ti@ifam.edu.br");
  console.log("   Professores: maria.santos@ifam.edu.br, joao.oliveira@ifam.edu.br, etc.");
  console.log(
    "   Alunos com trabalhos: breno.santos@edu.ifam.edu.br, juliana.costa@edu.ifam.edu.br, etc.",
  );
  console.log(
    "   Alunos sem trabalhos: gustavo.alves@edu.ifam.edu.br, melissa.ribeiro@edu.ifam.edu.br, etc.\n",
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
