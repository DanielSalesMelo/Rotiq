// Este é um script Node.js para automatizar a configuração da Parte 1 do Sprint 2 (v2 - Corrigido).
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

const createFile = (filePath, content) => {
    const fullPath = path.join(__dirname, filePath);
    const dirName = path.dirname(fullPath);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }
    console.log(`>> Criando/Sobrescrevendo arquivo: ${filePath}`);
    fs.writeFileSync(fullPath, content.trim());
};

const createDir = (dirPath) => {
    const fullPath = path.join(__dirname, dirPath);
    if (!fs.existsSync(fullPath)) {
        console.log(`>> Criando diretório: ${dirPath}`);
        fs.mkdirSync(fullPath, { recursive: true });
    }
};

console.log("--- INICIANDO SPRINT 2, PARTE 1: ESTRUTURA DO MÓDULO DE TI (v2) ---");

const tiServicePath = 'packages/services/ti-desk';

// 0. Criar a pasta do serviço se não existir
createDir(tiServicePath);

// 1. Inicializar o projeto PNPM para o novo serviço
run(`pnpm init`, tiServicePath);

// 2. Adicionar dependências básicas (Express + TypeScript)
run(`pnpm add express`, tiServicePath);
run(`pnpm add -D typescript @types/express @types/node ts-node-dev`, tiServicePath);

// 3. Modificar o package.json do serviço de TI
const tiPackageJsonPath = path.join(tiServicePath, 'package.json');
const tiPackageJson = JSON.parse(fs.readFileSync(tiPackageJsonPath, 'utf8'));
tiPackageJson.name = "@nexcore/ti-desk-service";
tiPackageJson.main = "dist/server.js";
tiPackageJson.scripts = {
    "dev": "ts-node-dev src/server.ts",
    "build": "tsc"
};
fs.writeFileSync(tiPackageJsonPath, JSON.stringify(tiPackageJson, null, 2));
console.log(">> package.json do serviço de TI atualizado com sucesso.");

// 4. Criar o arquivo de configuração do TypeScript (tsconfig.json)
createFile(`${tiServicePath}/tsconfig.json`, `
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
`);

// 5. Criar a estrutura de pastas e o servidor web básico
createFile(`${tiServicePath}/src/server.ts`, `
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/tickets', (req, res) => {
    res.json([{ id: 1, title: "Impressora quebrada" }]);
});

app.post('/tickets', (req, res) => {
    res.status(201).json({ message: "Ticket criado", data: req.body });
});

app.listen(PORT, () => {
    console.log(\`🚀 Módulo de TI rodando na porta \${PORT}\`);
});
`);

// 6. Adicionar o schema do Prisma para o módulo de TI (CORRIGIDO)
const prismaSchemaPath = 'packages/shared-libs/db-schemas/prisma/schema.prisma';
// CORREÇÃO: Garante que o arquivo schema.prisma exista antes de tentar adicionar a ele.
if (!fs.existsSync(prismaSchemaPath)) {
    createFile(prismaSchemaPath, `
// Arquivo de Schema Prisma principal.
// Defina aqui seus geradores e fontes de dados.
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
`);
}

const tiSchema = `

// Módulo TI Service Desk
model Ticket {
  id          String    @id @default(uuid())
  title       String
  description String?
  status      String    @default("OPEN")
  priority    String    @default("MEDIUM")
  requesterId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
`;
fs.appendFileSync(prismaSchemaPath, tiSchema);
console.log(">> Schema do Prisma para o módulo de TI adicionado/atualizado.");

console.log("\n--- FINALIZANDO E ENVIANDO PARA O GITHUB ---");

// 7. Fazer commit e push das alterações
run('git add .');
run('git commit -m "feat(ti-desk): setup initial structure and basic server"');
run('git push');

console.log("\n✅ SUCESSO! A estrutura inicial do Módulo de TI foi criada e enviada para o GitHub.");
console.log("O script 'setup-sprint2-part1.cjs' pode ser deletado.");
