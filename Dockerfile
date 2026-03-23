# Build stage
FROM node:18 AS builder

WORKDIR /app

# Copia package.json do backend e instala dependências (inclui devDeps para build)
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci

# Copia todo o backend e roda build
COPY backend/ ./
RUN npm run build

# Production stage
FROM node:18-slim AS runner
WORKDIR /app

# Copia apenas o necessário do builder
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
# Instala apenas production deps
WORKDIR /app/backend
RUN npm ci --production

# Expor porta (o app deve usar process.env.PORT)
EXPOSE 3000

# Start (assume que build gera dist/index.js)
CMD ["node", "dist/index.js"]