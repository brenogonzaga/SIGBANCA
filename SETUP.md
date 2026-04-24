# 🚀 Setup Rápido - SIGBANCA

## Sequência de Comandos

```bash
# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite o .env se necessário

# 4. Inicie containers Docker (PostgreSQL, MinIO, Adminer)
docker-compose up -d

# 5. Aguarde ~10 segundos para o PostgreSQL inicializar
sleep 10

# 6. Execute migrations
npx prisma migrate deploy

# 7. Gere o Prisma Client
npx prisma generate

# 8. Popule o banco (OPCIONAL - dados de teste)
npm run db:seed:full

# 9. Inicie o servidor
npm run dev
```
