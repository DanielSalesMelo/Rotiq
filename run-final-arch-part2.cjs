const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const createDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

console.log("🚀 INICIANDO ARQUITETURA DEFINITIVA (Parte 2 de 3) 🚀");
const schemaPath = 'packages/shared-libs/db-schemas/prisma/schema.prisma';
const coreServicePath = 'packages/services/core-service';
const migrationsPath = 'packages/shared-libs/db-schemas/prisma/migrations';

try {
    console.log("--- Etapa 2: Resetando e Sincronizando o Banco de Dados ---");
    if (fs.existsSync(migrationsPath)) {
        console.log(">> Apagando migrações antigas...");
        fs.rmSync(migrationsPath, { recursive: true, force: true });
    }
    run(`pnpm exec prisma migrate dev --name "init_final_arch" --schema=${schemaPath}`);
    console.log("✅ Banco de dados resetado e sincronizado.");

    console.log("--- Etapa 3: Criando a estrutura do Core Service ---");
    createDir(coreServicePath);
    createDir(path.join(coreServicePath, 'src'));

    const pkgJson = { name: "@nexcore/core-service", version: "1.0.0", scripts: { dev: "ts-node-dev src/server.ts" }, dependencies: { express: "4.19.2" }, devDependencies: { "@types/express": "4.17.21", "ts-node-dev": "2.0.0" } };
    fs.writeFileSync(path.join(coreServicePath, 'package.json'), JSON.stringify(pkgJson, null, 2));

    const tsconfig = { compilerOptions: { target: "ES2020", module: "CommonJS", esModuleInterop: true, strict: true, skipLibCheck: true } };
    fs.writeFileSync(path.join(coreServicePath, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

    const serverCode = `
import express from 'express';
import { PrismaClient } from '@prisma/client';
const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
app.use(express.json());
app.post('/tenants', async (req, res) => { try { const t = await prisma.tenant.create({ data: req.body }); res.status(201).json(t); } catch (e) { res.status(400).json({ error: 'Erro.' }); } });
app.post('/companies', async (req, res) => { try { const c = await prisma.company.create({ data: req.body }); res.status(201).json(c); } catch (e) { res.status(400).json({ error: 'Erro.' }); } });
app.listen(PORT, () => { console.log(\`🏛️  Servidor do Módulo Core rodando na porta \${PORT}\`); });
`;
    fs.writeFileSync(path.join(coreServicePath, 'src', 'server.ts'), serverCode);
    console.log("✅ Estrutura do Core Service criada.");
    console.log("\n🏁 FIM DA PARTE 2. Execute a Parte 3 para finalizar. 🏁");
} catch (e) {
    console.error("🚨 Erro na Parte 2:", e.message);
}
