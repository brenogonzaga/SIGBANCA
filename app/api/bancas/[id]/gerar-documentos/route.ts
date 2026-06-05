import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { withAuthContext } from "@/app/lib/authMiddleware";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { AtaDefesa } from "@/app/components/documents/AtaDefesa";
import { MarkdownPdf } from "@/app/lib/markdownPdf";
import { uploadFile } from "@/app/lib/minio";
import fs from "fs";
import path from "path";

export const POST = withAuthContext<{ params: Promise<{ id: string }> }>(
  async (request, user, { params }) => {
    try {
      const { id } = await params;

      // 1. Buscar dados completos da banca incluindo critérios de avaliação
      const banca = await prisma.banca.findUnique({
        where: { id },
        include: {
          trabalho: {
            include: {
              aluno: true,
              orientador: true,
            },
          },
          membros: {
            include: {
              usuario: true,
              avaliacao: {
                include: {
                  criterios: true
                }
              },
            },
          },
        },
      });

      if (!banca) {
        return NextResponse.json({ error: "Banca não encontrada" }, { status: 404 });
      }

      // Verificar permissão (Apenas orientador, coordenador ou admin)
      const isOrientador = banca.trabalho.orientadorId === user.userId;
      const isAdmin = user.role === "ADMIN" || user.role === "COORDENADOR";

      if (!isOrientador && !isAdmin) {
        return NextResponse.json(
          { error: "Sem permissão para gerar documentos desta banca" },
          { status: 403 }
        );
      }

      if (banca.status !== "REALIZADA" || !banca.notaFinal) {
        return NextResponse.json(
          { error: "A banca precisa estar marcada como REALIZADA e possuir nota final para gerar os documentos" },
          { status: 400 }
        );
      }

      // 1.5. Buscar assinaturas eletrônicas das avaliações
      const avaliacaoIds = banca.membros.map((m) => m.avaliacao?.id).filter(Boolean) as string[];
      const assinaturas = await prisma.assinaturaEletronica.findMany({
        where: {
          entidadeId: { in: avaliacaoIds },
          tipoDocumento: "AVALIACAO_INDIVIDUAL"
        }
      });

      // 2. Mapeamento de Membros (Orientador/Presidente, Membro 1, Membro 2)
      const orientadorMembro = banca.membros.find(m => m.papel === "ORIENTADOR");
      const avaliadoresMembros = banca.membros.filter(m => m.papel !== "ORIENTADOR");
      const membro1 = avaliadoresMembros[0];
      const membro2 = avaliadoresMembros[1];

      const isTcc1 = banca.trabalho.tipo === "TCC1";

      // Função auxiliar para mapear notas detalhadas de cada membro
      const obterNotasMembro = (membro: any) => {
        const avaliacao = membro?.avaliacao;
        if (!avaliacao || !avaliacao.criterios || avaliacao.criterios.length === 0) {
          return { escrito: 0, oral: 0, software: 0, final: 0 };
        }

        const getCritNota = (nome: string) => {
          const c = avaliacao.criterios.find((c: any) => c.nome.toLowerCase().includes(nome.toLowerCase()));
          return c ? Number(c.nota) : 0;
        };

        if (isTcc1) {
          // TCC 1: Soma simples direta dos 8 critérios do trabalho escrito
          const escrito = getCritNota("Problema") + 
                          getCritNota("Objetivos") + 
                          getCritNota("Fundamentação") + 
                          getCritNota("Abordagem") + 
                          getCritNota("Metodológica") + 
                          getCritNota("Proposta") + 
                          getCritNota("Riscos") + 
                          getCritNota("Solução Proposta");
          const oral = getCritNota("Apresentação") + getCritNota("tempo");
          return { escrito, oral, software: 0, final: Number(avaliacao.nota) };
        } else {
          // TCC 2: Soma ponderada/proporcional
          const escrito = getCritNota("Introdução") + 
                          getCritNota("Objetivos") + 
                          getCritNota("Fundamentação") + 
                          getCritNota("Abordagem") + 
                          getCritNota("Metodológica") + 
                          getCritNota("Apresentação dos resultados") + 
                          getCritNota("Discussão");
          const oral = getCritNota("Apresentação") + getCritNota("tempo");
          const software = getCritNota("Software");
          return { escrito, oral, software, final: Number(avaliacao.nota) };
        }
      };

      const notasOrientador = obterNotasMembro(orientadorMembro);
      const notasMembro1 = obterNotasMembro(membro1);
      const notasMembro2 = obterNotasMembro(membro2);

      const formatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });
      const dataExtenso = formatter.format(banca.data);

      const obterDadosAssinatura = (membro: any) => {
        if (!membro || !membro.avaliacao) return null;
        const ass = assinaturas.find(a => a.entidadeId === membro.avaliacao.id);
        if (!ass) return null;
        return {
          nome: membro.usuario.nome,
          papel: membro.papel === "ORIENTADOR" ? "ORIENTADOR (A) / PRESIDENTE" : membro.papel,
          hash: ass.hashAssinatura,
          dataHora: ass.dataHora.toLocaleString("pt-BR")
        };
      };

      const dadosComuns = {
        instituicao: "Instituto Federal de Educação, Ciência e Tecnologia do Amazonas",
        campus: "Campus Manaus Centro",
        curso: banca.trabalho.curso,
        aluno: banca.trabalho.aluno.nome,
        tituloTrabalho: banca.trabalho.titulo,
        data: dataExtenso,
        horario: banca.horario,
        local: banca.local,
        membros: banca.membros.map((m) => {
          const ass = obterDadosAssinatura(m);
          return {
            nome: m.usuario.nome,
            papel: m.papel,
            nota: m.avaliacao?.nota || undefined,
            instituicao: m.usuario.departamento || "IFAM",
            assinatura: ass ? {
              hash: ass.hash,
              data: ass.dataHora
            } : null
          };
        }),
        notaFinal: banca.notaFinal,
        resultado: banca.resultado || "APROVADO",
      };

      // 3. Gerar Ata de Defesa (Componente Estático Original)
      const ataElement = React.createElement(AtaDefesa, { dados: dadosComuns });
      const ataBuffer = await renderToBuffer(ataElement);
      const ataPath = `bancas/${id}/ata_defesa_${Date.now()}.pdf`;
      const { url: ataUrl } = await uploadFile(ataBuffer, ataPath);

      // 4. Gerar Ficha Geral de Avaliação a partir de docs/ficha_geral.md
      const fichaGeralTemplatePath = path.join(process.cwd(), "docs", "ficha_geral.md");
      const fichaGeralTemplate = fs.readFileSync(fichaGeralTemplatePath, "utf8");

      const filledFichaGeral = fichaGeralTemplate
        .replace("{{data}}", dataExtenso)
        .replace("{{horario}}", banca.horario)
        .replace("{{alunoNome}}", banca.trabalho.aluno.nome)
        .replace("{{tipoTrabalho}}", isTcc1 ? "TCC 1" : "TCC 2")
        .replace("{{orientadorNome}}", banca.trabalho.orientador.nome)
        .replace("{{membro1Nome}}", membro1?.usuario.nome || "Não definido")
        .replace("{{membro2Nome}}", membro2?.usuario.nome || "Não definido")
        .replace("{{tituloTrabalho}}", banca.trabalho.titulo)
        .replace("{{orientadorEscrito}}", notasOrientador.escrito.toFixed(1))
        .replace("{{membro1Escrito}}", notasMembro1.escrito.toFixed(1))
        .replace("{{membro2Escrito}}", notasMembro2.escrito.toFixed(1))
        .replace("{{orientadorOral}}", notasOrientador.oral.toFixed(1))
        .replace("{{membro1Oral}}", notasMembro1.oral.toFixed(1))
        .replace("{{membro2Oral}}", notasMembro2.oral.toFixed(1))
        .replace("{{orientadorSoftware}}", isTcc1 ? "-" : notasOrientador.software.toFixed(1))
        .replace("{{membro1Software}}", isTcc1 ? "-" : notasMembro1.software.toFixed(1))
        .replace("{{membro2Software}}", isTcc1 ? "-" : notasMembro2.software.toFixed(1))
        .replace("{{orientadorFinal}}", notasOrientador.final.toFixed(1))
        .replace("{{membro1Final}}", notasMembro1.final.toFixed(1))
        .replace("{{membro2Final}}", notasMembro2.final.toFixed(1))
        .replace("{{mediaFinal}}", banca.notaFinal.toFixed(2))
        .replace("{{alteracoesPropostas}}", banca.observacoes || "Nenhuma alteração proposta.");

      const fichaGeralElement = React.createElement(MarkdownPdf, {
        markdown: filledFichaGeral,
        assinaturas: {
          orientador: obterDadosAssinatura(orientadorMembro),
          membro1: obterDadosAssinatura(membro1),
          membro2: obterDadosAssinatura(membro2),
          aluno: null // Fica pendente pois a assinatura do aluno é feita no termo de autorização
        }
      });
      const fichaGeralBuffer = await renderToBuffer(fichaGeralElement);
      const fichaGeralPath = `bancas/${id}/ficha_geral_${Date.now()}.pdf`;
      const { url: fichaGeralUrl } = await uploadFile(fichaGeralBuffer, fichaGeralPath);

      // 5. Gerar Termo de Aprovação a partir de docs/termo_aprovacao.md
      const termoAprovacaoTemplatePath = path.join(process.cwd(), "docs", "termo_aprovacao.md");
      const termoAprovacaoTemplate = fs.readFileSync(termoAprovacaoTemplatePath, "utf8");

      const filledTermoAprovacao = termoAprovacaoTemplate
        .replace("{{tituloTrabalho}}", banca.trabalho.titulo)
        .replace("{{alunoNomeMaiusculo}}", banca.trabalho.aluno.nome.toUpperCase())
        .replace("{{dataAprovacao}}", dataExtenso);

      const termoAprovacaoElement = React.createElement(MarkdownPdf, {
        markdown: filledTermoAprovacao,
        assinaturas: {
          orientador: obterDadosAssinatura(orientadorMembro),
          membro1: obterDadosAssinatura(membro1),
          membro2: obterDadosAssinatura(membro2)
        }
      });
      const termoAprovacaoBuffer = await renderToBuffer(termoAprovacaoElement);
      const termoAprovacaoPath = `bancas/${id}/termo_aprovacao_${Date.now()}.pdf`;
      const { url: termoAprovacaoUrl } = await uploadFile(termoAprovacaoBuffer, termoAprovacaoPath);

      // 5.5. Enviar PDFs para o DocuSign
      const { createEnvelope } = await import("@/app/lib/docusign");
      
      const pdfsParaAssinar = [
        { name: "Ata_de_Defesa.pdf", buffer: ataBuffer },
        { name: "Ficha_Geral.pdf", buffer: fichaGeralBuffer },
        { name: "Termo_Aprovacao.pdf", buffer: termoAprovacaoBuffer },
      ];

      const signers = [];
      if (orientadorMembro) {
        signers.push({
          email: orientadorMembro.usuario.email,
          name: orientadorMembro.usuario.nome,
          routingOrder: "1",
          anchorString: `[sg_${orientadorMembro.usuario.nome}]`,
        });
      }
      if (membro1) {
        signers.push({
          email: membro1.usuario.email,
          name: membro1.usuario.nome,
          routingOrder: "1",
          anchorString: `[sg_${membro1.usuario.nome}]`,
        });
      }
      if (membro2) {
        signers.push({
          email: membro2.usuario.email,
          name: membro2.usuario.nome,
          routingOrder: "1",
          anchorString: `[sg_${membro2.usuario.nome}]`,
        });
      }

      const docusignEnvelopeId = await createEnvelope(
        pdfsParaAssinar,
        signers,
        `Documentos de Avaliação - ${banca.trabalho.aluno.nome}`
      );

      // 6. Atualizar a Banca no banco de dados com os novos campos de PDFs e DocuSign
      const bancaAtualizada = await prisma.banca.update({
        where: { id },
        data: {
          ataPdfUrl: ataUrl,
          fichaGeralPdfUrl: fichaGeralUrl,
          termoAprovacaoPdfUrl: termoAprovacaoUrl,
          docusignEnvelopeId: docusignEnvelopeId,
          statusAssinatura: "PENDENTE",
        },
      });

      // 7. Registrar Log de Auditoria
      await prisma.auditLog.create({
        data: {
          usuarioId: user.userId,
          acao: "GENERATE_DOCUMENTS",
          entidade: "BANCA",
          entidadeId: id,
          detalhes: {
            ataPdfUrl: ataUrl,
            fichaGeralPdfUrl: fichaGeralUrl,
            termoAprovacaoPdfUrl: termoAprovacaoUrl,
          },
        },
      });

      return NextResponse.json({
        message: "Documentos oficiais gerados com sucesso!",
        ataPdfUrl: ataUrl,
        fichaGeralPdfUrl: fichaGeralUrl,
        termoAprovacaoPdfUrl: termoAprovacaoUrl,
      });
    } catch (error) {
      console.error("Erro ao gerar documentos da banca:", error);
      return NextResponse.json({ error: "Erro ao gerar documentos" }, { status: 500 });
    }
  }
);
