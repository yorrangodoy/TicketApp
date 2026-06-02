FROM node:20-alpine AS builder

WORKDIR /app/order-service

COPY order-service/package.json order-service/tsconfig.json ./
COPY shared/package.json ../shared/package.json

RUN npm install
RUN cd ../shared && npm install

COPY order-service/src ./src
COPY shared ../shared

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/order-service/dist ./dist
COPY --from=builder /app/order-service/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/order-service/src/server.js"]
