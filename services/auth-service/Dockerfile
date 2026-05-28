FROM node:20-alpine AS builder

WORKDIR /app/auth-service

# Copiar package.json de ambos antes do install (aproveita cache do Docker)
COPY auth-service/package.json auth-service/tsconfig.json ./
COPY shared/package.json ../shared/package.json

# Instalar dependências do auth-service e do shared separadamente
RUN npm install
RUN cd ../shared && npm install

# Copiar código-fonte (COPY não apaga node_modules já instalados acima)
COPY auth-service/src ./src
COPY shared ../shared

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/auth-service/dist ./dist
COPY --from=builder /app/auth-service/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/auth-service/src/server.js"]
