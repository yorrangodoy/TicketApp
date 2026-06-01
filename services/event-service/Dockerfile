FROM node:20-alpine AS builder

WORKDIR /app/event-service

COPY event-service/package.json event-service/tsconfig.json ./
COPY shared/package.json ../shared/package.json

RUN npm install
RUN cd ../shared && npm install

COPY event-service/src ./src
COPY shared ../shared

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/event-service/dist ./dist
COPY --from=builder /app/event-service/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/event-service/src/server.js"]
