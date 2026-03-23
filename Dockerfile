FROM node:18

WORKDIR /app

# Copia package.json do backend e instala dependências no diretório correto
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --production

# Copia todo o backend
WORKDIR /app
COPY backend/ ./backend/

# Expor porta (o app usa process.env.PORT)
EXPOSE 3000

# Start usando package.json (assume index.js em backend/)
WORKDIR /app/backend
CMD ["npm", "start"]