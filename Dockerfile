FROM node:18-slim AS builder

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

COPY server/ ./
RUN npm run build

FROM node:18-slim

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

COPY --from=builder /app/server/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
