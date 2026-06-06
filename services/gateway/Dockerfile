FROM node:20-alpine AS builder

WORKDIR /app/gateway

# Copiar package.json e tsconfig antes do install (aproveita cache do Docker)
COPY gateway/package.json gateway/tsconfig.json ./
COPY shared/package.json ../shared/package.json

# Instalar dependências do gateway e do shared separadamente
RUN npm install
RUN cd ../shared && npm install

# Copiar código-fonte do gateway e de todos os serviços incluídos no tsconfig
COPY gateway/src ./src
COPY shared ../shared
COPY order-service/src ../order-service/src
COPY payment-service/src ../payment-service/src
COPY notification-service/src ../notification-service/src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/gateway/dist ./dist
COPY --from=builder /app/gateway/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/gateway/src/server.js"]
