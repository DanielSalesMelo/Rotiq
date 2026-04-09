// Script para configurar o Sentry (v3 - Corrigido com flag -w)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DSN_FRONTEND = "https://b3b915a2f47d3e6492c11b46adf08a3b@o4511192032739328.ingest.us.sentry.io/4511192045780992";
const DSN_BACKEND = "https://957618949ffa16249287972895a19cde@o4511192032739328.ingest.us.sentry.io/4511192079925248";

const run = (command, cwd = '.') => {
    console.log(`>> [${cwd}] Executando: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', cwd });
    } catch (error) {
        console.error(`\n❌ Falha ao executar o comando: ${command}`);
        process.exit(1);
    }
};

console.log("--- INICIANDO SPRINT 2, PARTE 2: INTEGRAÇÃO COM SENTRY ---");

// 1. Instalar dependências do Sentry no Front-end (CORRIGIDO COM -w)
run('pnpm add -w @sentry/react @sentry/vite-plugin');

// 2. Instalar dependências do Sentry no Back-end (módulo de TI)
run('pnpm add @sentry/node @sentry/profiling-node', 'packages/services/ti-desk');

// 3. Modificar o código do Front-end para inicializar o Sentry
const mainTsxPath = 'src/main.tsx';
if (fs.existsSync(mainTsxPath)) {
    let mainTsxContent = fs.readFileSync(mainTsxPath, 'utf8');
    if (!mainTsxContent.includes('Sentry.init')) {
        const sentryInitCode = `
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "${DSN_FRONTEND}",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
`;
        fs.writeFileSync(mainTsxPath, sentryInitCode + '\n' + mainTsxContent);
        console.log(`>> Sentry inicializado em ${mainTsxPath}`);
    } else {
        console.log(`>> Sentry já parece estar inicializado em ${mainTsxPath}. Pulando.`);
    }
} else {
    console.warn(`>> AVISO: Arquivo ${mainTsxPath} não encontrado. Pulei a inicialização do Sentry no front-end.`);
}

// 4. Modificar o código do Back-end (Módulo de TI) para inicializar o Sentry
const serverTsPath = 'packages/services/ti-desk/src/server.ts';
let serverTsContent = fs.readFileSync(serverTsPath, 'utf8');
if (!serverTsContent.includes('Sentry.init')) {
    const sentryExpressInit = `
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
`;
    const sentryExpressConfig = `
Sentry.init({
  dsn: "${DSN_BACKEND}",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
`;
    const sentryErrorHandler = `
app.use(Sentry.Handlers.errorHandler());
`;
    serverTsContent = serverTsContent.replace("import express from 'express';", `${sentryExpressInit}\nimport express from 'express';`);
    serverTsContent = serverTsContent.replace("const app = express();", `const app = express();\n${sentryExpressConfig}`);
    serverTsContent = serverTsContent.replace("app.listen(PORT, () => {", `${sentryErrorHandler}\napp.listen(PORT, () => {`);
    fs.writeFileSync(serverTsPath, serverTsContent);
    console.log(">> Sentry inicializado no Módulo de TI.");
} else {
    console.log(">> Sentry já parece estar inicializado no Módulo de TI. Pulando.");
}

console.log("\n--- FINALIZANDO E ENVIANDO PARA O GITHUB ---");

// 5. Fazer commit e push das alterações
run('git add .');
run('git commit -m "feat(monitoring): integrate sentry for error tracking"');
run('git push');

console.log("\n✅ SUCESSO! Sentry foi integrado e as alterações foram enviadas para o GitHub.");
