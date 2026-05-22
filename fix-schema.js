const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Update Protocolo relation to have onDelete: Cascade
content = content.replace(
  'trabalho   Trabalho @relation(fields: [trabalhoId], references: [id])',
  'trabalho   Trabalho @relation(fields: [trabalhoId], references: [id], onDelete: Cascade)'
);

// Add assinaturasEletronicas to Usuario
content = content.replace(
  'protocolosComoResponsavel Protocolo[]     @relation("ProtocoloResponsavel")',
  'protocolosComoResponsavel Protocolo[]     @relation("ProtocoloResponsavel")\n    assinaturasEletronicas  AssinaturaEletronica[]'
);

// Add autorizacaoPublicacao to Trabalho
content = content.replace(
  'protocolos Protocolo[]',
  'protocolos Protocolo[]\n    autorizacaoPublicacao AutorizacaoPublicacao?'
);

// Append new models
const newModels = `
model AutorizacaoPublicacao {
    id             String   @id @default(cuid())
    trabalhoId     String   @unique
    trabalho       Trabalho @relation(fields: [trabalhoId], references: [id], onDelete: Cascade)
    rg             String
    cpf            String
    email          String
    confidencial   Boolean  @default(false)
    geraPatente    Boolean  @default(false)
    liberadoReprod Boolean  @default(true)
    documentoUrl   String?  // URL do PDF gerado
    assinaturaId   String?  // Ligação com a assinatura eletrônica
    createdAt      DateTime @default(now())

    @@map("autorizacoes_publicacao")
}

model AssinaturaEletronica {
    id              String   @id @default(cuid())
    usuarioId       String
    usuario         Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
    tipoDocumento   String   // FICHA_GERAL, TERMO_APROVACAO, TERMO_AUTORIZACAO
    entidadeId      String   // ID da Banca ou da AutorizacaoPublicacao
    hashAssinatura  String   // Hash gerado
    ipAddress       String
    dataHora        DateTime @default(now())

    @@index([usuarioId])
    @@index([entidadeId, tipoDocumento])
    @@map("assinaturas_eletronicas")
}
`;

fs.writeFileSync('prisma/schema.prisma', content + '\n' + newModels);
console.log('Done!');
