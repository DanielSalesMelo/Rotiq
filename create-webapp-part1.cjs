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

const webAppPath = 'packages/apps/web-app';

console.log("--- PARTE 1: CRIANDO A ESTRUTURA DO FRONTEND ---");

// Etapa 1: Criar a estrutura mínima do pacote
console.log('\n>> Etapa 1: Criando estrutura mínima do pacote...');
fs.mkdirSync(webAppPath, { recursive: true });
const initialPackageJson = {
    "name": "@nexcore/web-app", "private": true, "version": "0.0.0", "type": "module",
    "scripts": {
        "dev": "vite", "build": "tsc && vite build", "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0", "preview": "vite preview"
    }
};
fs.writeFileSync(path.join(webAppPath, 'package.json'), JSON.stringify(initialPackageJson, null, 2));

// Etapa 2: Rodar 'pnpm install' para registrar o novo workspace
console.log('\n>> Etapa 2: Registrando o novo pacote no workspace...');
run(`pnpm install`);

// Etapa 3: Instalar as dependências
console.log('\n>> Etapa 3: Instalando dependências do React, Vite e TailwindCSS...');
run(`pnpm add react react-dom --filter @nexcore/web-app`);
run(`pnpm add -D typescript @types/react @types/react-dom @vitejs/plugin-react vite eslint autoprefixer postcss tailwindcss --filter @nexcore/web-app`);

// Etapa 4: Configurar o TailwindCSS
console.log('\n>> Etapa 4: Configurando TailwindCSS...');
run('pnpm exec tailwindcss init -p', webAppPath);
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [ "./index.html", "./src/**/*.{js,ts,jsx,tsx}", ],
  theme: { extend: {}, },
  plugins: [],
}`;
fs.writeFileSync(path.join(webAppPath, 'tailwind.config.js'), tailwindConfig);

console.log('\n✅ SUCESSO! Parte 1 concluída. A estrutura do frontend e as dependências estão prontas.');
