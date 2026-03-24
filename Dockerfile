FROM node:18

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install

COPY server/ ./

RUN npm run build

RUN npm prune --production

EXPOSE 3000

CMD ["npm", "start"]