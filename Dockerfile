FROM node:18

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --production

COPY server/ ./

EXPOSE 3000

CMD ["npm", "start"]