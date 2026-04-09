// Script Parte 2 para finalizar o Sprint 5: API do Módulo Frota
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

const fleetServicePath = 'packages/services/fleet';

console.log("--- CONTINUANDO SPRINT 5: API DO MÓDULO FROTA ---");

// 1. Criar a estrutura de pastas (o que faltou no script anterior)
console.log('\n>> Etapa 1: Criando a estrutura de pastas do serviço...');
run(`mkdir -p ${path.join(fleetServicePath, 'src')}`);

// 2. Iniciar o projeto e instalar dependências
console.log('\n>> Etapa 2: Iniciando projeto e instalando dependências...');
run(`pnpm init`, fleetServicePath);
run(`pnpm add express @prisma/client@4.16.2 --filter @nexcore/fleet`);
run(`pnpm add -D typescript @types/express @types/node ts-node-dev --filter @nexcore/fleet`);

// 3. Configurar o package.json, tsconfig.json e server.ts
console.log('\n>> Etapa 3: Configurando os arquivos da API...');

// Modificar o package.json
const fleetPackageJsonPath = path.join(fleetServicePath, 'package.json');
const fleetPackageJson = JSON.parse(fs.readFileSync(fleetPackageJsonPath, 'utf8'));
fleetPackageJson.name = "@nexcore/fleet";
fleetPackageJson.main = "dist/server.js";
fleetPackageJson.scripts = { "dev": "ts-node-dev src/server.ts", "build": "tsc" };
fs.writeFileSync(fleetPackageJsonPath, JSON.stringify(fleetPackageJson, null, 2));

// Criar tsconfig.json
fs.writeFileSync(path.join(fleetServicePath, 'tsconfig.json'), `
{
  "compilerOptions": {
    "target": "es2020", "module": "commonjs", "outDir": "./dist", "rootDir": "./src",
    "strict": true, "esModuleInterop": true, "skipLibCheck": true, "forceConsistentCasingInFileNames": true
  }
}`);

// Criar o server.ts
const fleetServerTsContent = `
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3002; // Porta para o serviço de Frota
const prisma = new PrismaClient();

app.use(express.json());

// --- Rotas de Veículos ---
app.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const newVehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao criar veículo', details: error });
  }
});

app.get('/vehicles', async (req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany();
  res.status(200).json(vehicles);
});

// --- Rotas de Motoristas ---
app.post('/drivers', async (req: Request, res: Response) => {
  try {
    const newDriver = await prisma.driver.create({ data: req.body });
    res.status(201).json(newDriver);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao criar motorista', details: error });
  }
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
console.log('>> Arquivos da API criados com sucesso.');

// 4. Salvar no GitHub
console.log('\n>> Etapa 4: Salvando progresso no GitHub...');
run('git add .');
run('git commit -m "feat(fleet): setup fleet module api structure"');
run('git push');

console.log('\n✅ SUCESSO! Sprint 5 concluído. O Módulo Frota está pronto.');
console.log("Os scripts 'run-sprint5.cjs' e 'run-sprint5-part2.cjs' podem ser deletados.");
