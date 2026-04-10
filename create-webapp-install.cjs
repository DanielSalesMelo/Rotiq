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

console.log("--- PARTE 1: CORRIGINDO WORKSPACE E INSTALANDO DEPENDÊNCIAS ---");

// Etapa 1: Corrigir o pnpm-workspace.yaml
fs.writeFileSync('pnpm-workspace.yaml', 'packages:\n  - \'packages/apps/*\'\n  - \'packages/services/*\'\n  - \'packages/shared-libs/*\'');
console.log('>> pnpm-workspace.yaml corrigido.');

// Etapa 2: Criar a estrutura mínima do pacote
fs.mkdirSync('packages/apps/web-app', { recursive: true });
const pkgJson = { "name": "@nexcore/web-app", "private": true, "version": "0.0.0", "type": "module", "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" } };
fs.writeFileSync('packages/apps/web-app/package.json', JSON.stringify(pkgJson, null, 2));

// Etapa 3: Rodar 'pnpm install' para registrar o novo workspace
console.log('\n>> Etapa 3: Registrando o novo pacote no workspace...');
run(`pnpm install`);

// Etapa 4: Instalar as dependências
console.log('\n>> Etapa 4: Instalando dependências...');
run(`pnpm add react react-dom --filter @nexcore/web-app`);
run(`pnpm add -D typescript @types/react @types/react-dom @vitejs/plugin-react vite eslint autoprefixer postcss tailwindcss --filter @nexcore/web-app`);

console.log('\n✅ SUCESSO! Parte 1 concluída. Instalação finalizada.');
