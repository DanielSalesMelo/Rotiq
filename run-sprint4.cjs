// Script Mestre para configurar o Sprint 4: Dar vida à API de TI
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const run = (command, cwd = '.') => {
    console.log(`>> [${cwd}] Executando: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', cwd });
    } catch (error) {
        console.error(`\n❌ Falha ao executar o comando: ${command}`);
        process.exit(1);
    }
};

const tiServicePath = 'packages/services/ti-desk';
const serverTsPath = path.join(tiServicePath, 'src/server.ts');

console.log("--- INICIANDO SPRINT 4: CONEXÃO DA API DE TI AO BANCO DE DADOS ---");

// 1. Instalar o Prisma Client no módulo de TI
console.log('\n>> Etapa 1: Instalando o Prisma Client no Módulo de TI...');
run(`pnpm add @prisma/client@4.16.2 --filter @nexcore/ti-desk-service`);

// 2. Gerar o Prisma Client novamente para garantir que ele esteja acessível
console.log('\n>> Etapa 2: Gerando o Prisma Client para o projeto...');
const prismaExecutable = path.resolve(__dirname, 'packages/shared-libs/db-schemas/node_modules/.bin/prisma');
const schemaPath = path.resolve(__dirname, 'packages/shared-libs/db-schemas/prisma/schema.prisma');
run(`"${prismaExecutable}" generate --schema="${schemaPath}"`);

// 3. Atualizar o server.ts do Módulo de TI com a lógica de banco de dados real
console.log('\n>> Etapa 3: Atualizando o server.ts com a lógica do Prisma...');
const serverTsContent = `
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3001; // Porta para o serviço de TI

// Inicializa o Prisma Client
const prisma = new PrismaClient();

app.use(express.json());

// Rota para criar um novo ticket
app.post('/tickets', async (req: Request, res: Response) => {
  try {
    const { title, description, requesterId, priority } = req.body;

    if (!title || !requesterId) {
      return res.status(400).json({ error: 'Título e ID do solicitante são obrigatórios.' });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        requesterId,
        priority,
      },
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res.status(500).json({ error: 'Não foi possível criar o ticket.' });
  }
});

// Rota para listar todos os tickets
app.get('/tickets', async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(tickets);
  } catch (error) {
    console.error("Erro ao listar tickets:", error);
    res.status(500).json({ error: 'Não foi possível listar os tickets.' });
  }
});

app.listen(PORT, () => {
  console.log(\`🚀 Servidor do Módulo de TI rodando na porta \${PORT}\`);
});
`;
fs.writeFileSync(serverTsPath, serverTsContent.trim());
console.log('>> Arquivo server.ts atualizado com sucesso.');

// 4. Salvar no GitHub
console.log('\n>> Etapa 4: Salvando progresso no GitHub...');
run('git add .');
run('git commit -m "feat(ti-desk): connect api to database using prisma"');
run('git push');

console.log('\n✅ SUCESSO! Sprint 4 concluído. A API de TI agora está conectada ao banco de dados.');
console.log("O script 'run-sprint4.cjs' pode ser deletado.");
