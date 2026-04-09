// Script Mestre para configurar o Sprint 5: Fundação do Módulo Frota
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

const dbSchemaPackagePath = 'packages/shared-libs/db-schemas';
const fleetServicePath = 'packages/services/fleet';
const prismaSchemaPath = path.join(dbSchemaPackagePath, 'prisma/schema.prisma');

console.log("--- INICIANDO SPRINT 5: FUNDAÇÃO DO MÓDULO FROTA ---");

// 1. Adicionar os modelos Vehicle e Driver ao schema.prisma
console.log('\n>> Etapa 1: Adicionando modelos Vehicle e Driver ao schema.prisma...');
const newModels = `
// Modelos do Módulo Frota
model Vehicle {
  id              String    @id @default(cuid())
  plate           String    @unique
  model           String
  brand           String
  year            Int
  status          String    @default("AVAILABLE") // AVAILABLE, IN_USE, MAINTENANCE
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Driver {
  id              String    @id @default(cuid())
  name            String
  licenseNumber   String    @unique
  licenseCategory String
  status          String    @default("ACTIVE") // ACTIVE, INACTIVE, ON_VACATION
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
`;
fs.appendFileSync(prismaSchemaPath, newModels);
console.log('>> Modelos adicionados ao schema com sucesso.');

// 2. Executar a migração para criar as novas tabelas
console.log('\n>> Etapa 2: Executando a migração do banco de dados...');
run(`pnpm --filter @nexcore/db-schemas exec prisma migrate dev --name add_fleet_models`);
// 3. Criar a estrutura e o servidor básico para o Módulo Frota
console.log('\n>> Etapa 3: Criando a estrutura do serviço do Módulo Frota...');
run(`pnpm init`, fleetServicePath);
run(`pnpm add express @prisma/client@4.16.2 --filter @nexcore/fleet`);
run(`pnpm add -D typescript @types/express @types/node ts-node-dev --filter @nexcore/fleet`);

// Modificar o package.json do serviço de Frota
const fleetPackageJsonPath = path.join(fleetServicePath, 'package.json');
const fleetPackageJson = JSON.parse(fs.readFileSync(fleetPackageJsonPath, 'utf8'));
fleetPackageJson.name = "@nexcore/fleet";
fleetPackageJson.main = "dist/server.js";
fleetPackageJson.scripts = { "dev": "ts-node-dev src/server.ts", "build": "tsc" };
fs.writeFileSync(fleetPackageJsonPath, JSON.stringify(fleetPackageJson, null, 2));

// Criar tsconfig.json e a pasta src
run(`mkdir -p ${path.join(fleetServicePath, 'src')}`);
fs.writeFileSync(path.join(fleetServicePath, 'tsconfig.json'), `
{
  "compilerOptions": {
    "target": "es2020", "module": "commonjs", "outDir": "./dist", "rootDir": "./src",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true, "forceConsistentCasingInFileNames": true
  }
}`);

// Criar o server.ts do Módulo Frota
const fleetServerTsContent = `
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3002; // Porta para o serviço de Frota
const prisma = new PrismaClient();

app.use(express.json());

// --- Rotas de Veículos ---
app.post('/vehicles', async (req: Request, res: Response) => {
  const newVehicle = await prisma.vehicle.create({ data: req.body });
  res.status(201).json(newVehicle);
});

app.get('/vehicles', async (req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany();
  res.status(200).json(vehicles);
});

// --- Rotas de Motoristas ---
app.post('/drivers', async (req: Request, res: Response) => {
  const newDriver = await prisma.driver.create({ data: req.body });
  res.status(201).json(newDriver);
});

app.get('/drivers', async (req: Request, res: Response) => {
  const drivers = await prisma.driver.findMany();
  res.status(200).json(drivers);
});

app.listen(PORT, () => {
  console.log(\`🚀 Servidor do Módulo de Frota rodando na porta \${PORT}\`);
});
`;
fs.writeFileSync(path.join(fleetServicePath, 'src/server.ts'), fleetServerTsContent.trim());
console.log('>> Estrutura do serviço de Frota criada com sucesso.');

// 4. Salvar no GitHub
console.log('\n>> Etapa 4: Salvando progresso no GitHub...');
run('git add .');
run('git commit -m "feat(fleet): setup fleet module structure, models, and basic api"');
run('git push');

console.log('\n✅ SUCESSO! Sprint 5 concluído. O Módulo Frota está pronto e suas tabelas foram criadas.');
console.log("O script 'run-sprint5.cjs' pode ser deletado.");
