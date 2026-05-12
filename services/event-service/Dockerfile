FROM node:20-alpine AS builder

WORKDIR /app

COPY event-service/package.json event-service/tsconfig.json ./
RUN npm install

COPY event-service/src ./src
COPY shared ./shared

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
