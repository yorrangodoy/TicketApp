FROM node:20-alpine AS builder

WORKDIR /app/payment-service

# Copiar package.json de ambos antes do install (aproveita cache do Docker)
COPY payment-service/package.json payment-service/tsconfig.json ./
COPY shared/package.json ../shared/package.json

# Instalar dependências do payment-service e do shared separadamente
RUN npm install
RUN cd ../shared && npm install

# Copiar código-fonte (COPY não apaga node_modules já instalados acima)
COPY payment-service/src ./src
COPY shared ../shared

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/payment-service/dist ./dist
COPY --from=builder /app/payment-service/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/payment-service/src/server.js"]
