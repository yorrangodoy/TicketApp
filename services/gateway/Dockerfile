FROM node:20-alpine AS builder

WORKDIR /app/gateway

# Copiar package.json de todos os serviços antes do install (aproveita cache do Docker)
COPY gateway/package.json gateway/tsconfig.json ./
COPY shared/package.json ../shared/package.json
COPY order-service/package.json ../order-service/package.json
COPY payment-service/package.json ../payment-service/package.json
COPY notification-service/package.json ../notification-service/package.json

# Instalar dependências de todos os serviços cujo código é compilado pelo tsc
RUN npm install
RUN cd ../shared && npm install
RUN cd ../order-service && npm install
RUN cd ../payment-service && npm install
RUN cd ../notification-service && npm install

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
