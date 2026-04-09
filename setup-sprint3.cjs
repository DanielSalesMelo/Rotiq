v4 - Sintaxe Corrigida
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATABASE_URL = process.env.DATABASE_URL;

const run = (command, cwd = '.', env = {}) => {
    console.log(`>> [\${cwd}] Executando: \${command}`);
    try {
        execSync(command, { 
            stdio: 'inherit', 
            cwd,
            env: { ...process.env, ...env }
        });
    } catch (error) {
        console.error(`\n Falha ao executar o comando: \${command}\`);
        process.exit(1);
    }
};

const createFile = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    const dirName = path.dirname(fullPath);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }
    console.log(`>> CriandoSobrescrevendo arquivo: \${filePath}`);
    fs.writeFileSync(fullPath, content.trim());
};

console.log("--- INICIANDO SPRINT 3: CONEXÃO COM BANCO DE DADOS E MIGRATION ---");

const dbSchemaPath = 'packages/shared-libs/db-schemas';

ETAPA 1: CRIAR E NOMEAR O PACOTE 'db-schemas'
console.log(">> Etapa 1: Configurando o pacote @nexcoredb-schemas...");
createFile(`${dbSchemaPath}package.json`, `
{
  "name": "@nexcoredb-schemas",
  "version": "1.0.0",
  "description": "Pacote central para schemas e migrations do Prisma.",
  "main": "index.js",
  "scripts": {
    "migrate:dev": "prisma migrate dev",
    "generate": "prisma generate"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
`);

ETAPA 2: INSTALAR O PRISMA
console.log(">> Etapa 2: Instalando o Prisma no pacote...");
run('pnpm add -D prisma --filter @nexcoredb-schemas');

ETAPA 3: GERAR O CLIENTE PRISMA
console.log(">> Etapa 3: Gerando o Prisma Client...");
run('pnpm --filter @nexcoredb-schemas run generate');

ETAPA 4: EXECUTAR A MIGRATION
console.log(">> Etapa 4: Executando a migration no banco de dados do Railway...");
createFile('.env', `DATABASE_URL="${DATABASE_URL}"`);
run('pnpm --filter @nexcoredb-schemas run migrate:dev --name init');

ETAPA 5: ATUALIZAR O MÓDULO DE TI
console.log(">> Etapa 5: Atualizando o Módulo de TI para usar o Prisma...");
const tiServerPath = 'packages/services/ti-desk/src/server.ts';
let tiServerContent = fs.readFileSync(tiServerPath, 'utf8');

const prismaImport = `import { PrismaClient } from '@prismaclient';`;
const prismaInit = `const prisma = new PrismaClient();`;

tiServerContent = tiServerContent.replace("import express from 'express';", `${prismaImport}\\nimport express from 'express';`);
tiServerContent = tiServerContent.replace("const app = express();", `const app = express();\\n${prismaInit}`);

const getTicketsLogic = `
app.get('tickets', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany();
        res.json(tickets);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Não foi possível buscar os tickets." });
    }
});
`;

const postTicketsLogic = `
app.post('tickets', async (req, res) => {
    try {
        const { title, description, requesterId } = req.body;
        if (!title || !requesterId) {
            return res.status(400).json({ error: "Título e ID do solicitante são obrigatórios." });
        }
        const newTicket = await prisma.ticket.create({
            data: { title, description, requesterId },
        });
        res.status(201).json(newTicket);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Não foi possível criar o ticket." });
    }
});
`;

tiServerContent = tiServerContent.replace(app\\.get\\('\\tickets',[\\s\\S]*\\);g, getTicketsLogic);
tiServerContent = tiServerContent.replace(app\\.post\\('\\tickets',[\\s\\S]*\\);g, postTicketsLogic);

fs.writeFileSync(tiServerPath, tiServerContent);

ETAPA 6: FINALIZAR E ENVIAR
console.log("\n--- FINALIZANDO E ENVIANDO PARA O GITHUB ---");
run('git add .');
run('git commit -m "feat(ti-desk): connect to database and implement prisma endpoints"');
run('git push');

console.log("\n SUCESSO! Módulo de TI conectado ao banco e endpoints atualizados.");
