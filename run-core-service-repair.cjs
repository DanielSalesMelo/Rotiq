const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 INICIANDO REPARO AUTOMATIZADO DO CORE SERVICE 🚀");

const run = (command) => execSync(command, { stdio: 'inherit' });
const coreServerPath = 'packages/services/core-service/src/server.ts';

// O CÓDIGO CORRETO E COMPLETO, INCLUINDO A ROTA /users
const correctApiCode = `
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());

// --- ROTAS DE TENANTS ---
app.post('/tenants', async (req, res) => {
  try {
    const tenant = await prisma.tenant.create({ data: req.body });
    res.status(201).json(tenant);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar tenant.' });
  }
});

// --- ROTAS DE COMPANIES ---
app.post('/companies', async (req, res) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar company.' });
  }
});

// --- ROTAS DE USERS (A ROTA QUE FALTAVA) ---
app.post('/users', async (req, res) => {
  try {
    // No futuro, aqui teremos a lógica para criptografar a senha (hashing)
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar usuário.' });
  }
});

app.listen(PORT, () => {
  console.log(\`🏛️ Servidor do Módulo Core (v2) rodando na porta \${PORT}\`);
});
`;

try {
    console.log("--- Etapa 1: Substituindo o código do Core Service ---");
    fs.writeFileSync(coreServerPath, correctApiCode);
    console.log("✅ Código do Core Service corrigido.");

    console.log("\n--- Etapa 2: Salvando reparo no GitHub ---");
    run('git add .');
    run('git commit -m "fix(core-service): add missing /users endpoint"');
    run('git push');
    console.log("✅ Reparo salvo no GitHub.");

    console.log("\n🏁 SUCESSO! REPARO DO CORE SERVICE CONCLUÍDO.");
    fs.unlinkSync('run-core-service-repair.cjs');

} catch (e) {
    console.error("\n🚨 FALHA NO REPARO:", e.message);
    process.exit(1);
}
