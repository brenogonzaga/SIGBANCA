# Walkthrough: Fluxo de Documentação Burocrática (End-to-End)

Este documento descreve o ciclo de vida completo de um TCC no SIGBANCA, focando na geração de documentos oficiais e protocolos.

---

## 1. Preparação do Ambiente

Antes de iniciar, certifique-se de que o banco de dados está populado.

- **Comando:** `npm run db:seed:full` (ou utilize o script de seed completo).
- **Acesso:** Use `admin@ifam.edu.br` / `senha123` para controle total.

---

## 2. Fase de Entrega (Workflow do Aluno)

O fluxo começa com o aluno submetendo seu trabalho para avaliação.

1. **Login como Aluno:** (Ex: `thiago@ifam.edu.br`).
2. **Submissão:** Vá em **Meus Trabalhos** -> **Enviar Nova Versão**.
3. **Upload:** Selecione o PDF do trabalho. O status mudará para `AGUARDANDO_AVALIACAO`.

---

## 3. Agendamento da Defesa (Workflow do Coordenador)

1. **Login como Coordenador/Admin:** (`admin@ifam.edu.br`).
2. **Seleção:** Vá em **Trabalhos** -> Selecione o trabalho do aluno.
3. **Agendar:** Clique em **Agendar Banca**.
4. **Comissão:** Escolha a data, local e os 3 membros (Orientador + 2 Avaliadores).
5. **Status:** O trabalho passa para `BANCA_AGENDADA`.

---

## 4. Realização da Defesa (Workflow da Banca)

A banca só é "Realizada" quando todos os membros lançam suas notas.

1. **Login como Professor:** Cada membro da banca deve logar.
2. **Avaliação:** Vá em **Bancas** -> Selecione a banca -> **Avaliar Trabalho**.
3. **Notas:** Preencha os critérios (Qualidade Técnica, Apresentação, etc.) e salve.
4. **Finalização Automática:** Quando o último membro avaliar, o sistema calcula a média e muda o status da banca para `REALIZADA`.

---

## 5. Documentos Oficiais da Defesa

Após a banca ser realizada, os documentos de comprovação são liberados.

1. **Acesso:** Logado como Admin ou Orientador, vá nos **Detalhes da Banca**.
2. **Geração:** No painel "Documentação da Defesa", clique em **Gerar Documentos Oficiais**.
3. **Resultado:**
   - **Ata de Defesa:** Documento administrativo para a coordenação.
   - **Folha de Aprovação:** Documento que o aluno deve baixar para inserir no seu PDF final.

---

## 6. Solicitação de Ficha Catalográfica (Workflow do Aluno)

Com a Folha de Aprovação em mãos, o aluno finaliza o PDF e pede a ficha da biblioteca.

1. **Login como Aluno.**
2. **Protocolo:** Vá em **Protocolos** -> **Abrir Novo Protocolo**.
3. **Tipo:** Selecione `FICHA_CATALOGRAFICA`.
4. **Anexo:** O aluno anexa a versão FINAL (já com a folha de aprovação inserida).

---

## 7. Processamento da Biblioteca (Workflow do Bibliotecário)

1. **Login como Bibliotecário/Admin.**
2. **Análise:** Vá em **Protocolos** -> Clique em **Processar** na solicitação do aluno.
3. **Geração Automática:**
   - Informe o **Código Cutter** (ex: S729m) e o **CDD** (ex: 005.3).
   - Clique em **Gerar Ficha Automaticamente**.
4. **Deferimento:** O sistema gera o PDF no padrão IFAM, anexa ao protocolo e muda o status para `DEFERIDO`.

---

## 8. Conclusão

O aluno recebe uma notificação, acessa seus protocolos e clica em **Baixar Resultado** para obter sua Ficha Catalográfica oficial e finalizar o processo acadêmico.
