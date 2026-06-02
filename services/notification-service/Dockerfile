FROM node:20-alpine AS builder

WORKDIR /app/notification-service

COPY notification-service/package.json notification-service/tsconfig.json ./
COPY shared/package.json ../shared/package.json

RUN npm install
RUN cd ../shared && npm install

COPY notification-service/src ./src
COPY shared ../shared

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/notification-service/dist ./dist
COPY --from=builder /app/notification-service/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/notification-service/src/server.js"]
