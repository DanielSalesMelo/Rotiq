FROM node:18

WORKDIR /app

# Copia package.json do backend e instala dependências
COPY backend/package*.json ./
RUN npm install --production

# Copia todo o backend
COPY backend/ ./

# Ajuste a porta se seu app usar outra porta
EXPOSE 3000

# Se o backend usa "npm start", troque por ["npm","start"]
CMD ["node", "index.js"]