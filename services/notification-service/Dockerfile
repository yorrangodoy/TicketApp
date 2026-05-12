FROM node:20-alpine AS builder

WORKDIR /app

COPY notification-service/package.json notification-service/tsconfig.json ./
RUN npm install

COPY notification-service/src ./src
COPY shared ./shared

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
