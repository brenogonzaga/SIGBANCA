const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

content = content.replace(
  'enum TrabalhoStatus {',
  'enum TipoTrabalho {\n    TCC1\n    TCC2\n}\n\nenum TrabalhoStatus {'
);

content = content.replace(
  'curso         String',
  'curso         String\n    tipo          TipoTrabalho   @default(TCC2)'
);

fs.writeFileSync('prisma/schema.prisma', content);
console.log('Done 2!');
