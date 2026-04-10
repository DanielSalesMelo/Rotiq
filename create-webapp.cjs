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
const srcPath = path.join(webAppPath, 'src');
const componentsPath = path.join(srcPath, 'components');

console.log("--- INICIANDO CRIAÇÃO COMPLETA DO FRONTEND (WEB-APP) ---");

// 1. Criar a pasta do web-app e iniciar o projeto Vite
if (fs.existsSync(webAppPath)) {
    console.log(`>> A pasta ${webAppPath} já existe. Pulando criação do projeto.`);
} else {
    console.log('\n>> Etapa 1: Criando e iniciando o projeto Vite (React + TypeScript)...');
    // O comando 'pnpm create vite' é interativo, então vamos usar uma abordagem não-interativa
    // Criamos a pasta e o package.json manualmente, depois instalamos as dependências
    fs.mkdirSync(webAppPath, { recursive: true });
    const initialPackageJson = {
        "name": "@nexcore/web-app",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "tsc && vite build",
            "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
            "preview": "vite preview"
        }
    };
    fs.writeFileSync(path.join(webAppPath, 'package.json'), JSON.stringify(initialPackageJson, null, 2));
}

// 2. Instalar dependências
console.log('\n>> Etapa 2: Instalando dependências do React, Vite e TailwindCSS...');
run(`pnpm --filter @nexcore/web-app add react react-dom`);
run(`pnpm --filter @nexcore/web-app add -D typescript @types/react @types/react-dom @vitejs/plugin-react vite eslint autoprefixer postcss tailwindcss`);
run(`pnpm install`); // Roda o install na raiz para garantir que tudo seja linkado

// 3. Configurar o TailwindCSS
console.log('\n>> Etapa 3: Configurando TailwindCSS...');
run('npx tailwindcss init -p', webAppPath);
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
fs.writeFileSync(path.join(webAppPath, 'tailwind.config.js'), tailwindConfig);

// 4. Criar arquivos base do Vite e CSS
console.log('\n>> Etapa 4: Criando arquivos de base...');
fs.mkdirSync(srcPath, { recursive: true });
const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NexCore</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
fs.writeFileSync(path.join(webAppPath, 'index.html'), indexHtml);

const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
fs.writeFileSync(path.join(srcPath, 'main.tsx'), mainTsx);

const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
fs.writeFileSync(path.join(srcPath, 'index.css'), indexCss);

// Copia o conteúdo do Sprint 7 para os arquivos corretos
console.log('\n>> Etapa 5: Criando os componentes do Dashboard...');
fs.mkdirSync(componentsPath, { recursive: true });
const headerContent = `
export function Header() {
  return (
    <header className="bg-gray-800 text-white shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center">
        <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
        <h1 className="text-2xl font-bold">NexCore</h1>
      </div>
      <div className="text-sm">
        <span>Bem-vindo, Daniel!</span>
      </div>
    </header>
   );
}`;
fs.writeFileSync(path.join(componentsPath, 'Header.tsx'), headerContent.trim());

const cardContent = `
import React from 'react';
interface CardProps { title: string; count: number; icon: React.ReactNode; children: React.ReactNode; buttonText: string; }
export function Card({ title, count, icon, children, buttonText }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
        <div className="bg-indigo-500 text-white rounded-full w-10 h-10 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-4">{count}</p>
      <div className="flex-grow space-y-2 text-sm text-gray-600 mb-4">{children}</div>
      <button className="mt-auto bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">{buttonText}</button>
    </div>
  );
}`;
fs.writeFileSync(path.join(componentsPath, 'Card.tsx'), cardContent.trim());

const dashboardContent = `
import { useEffect, useState } from 'react';
import { Card } from './Card';
import { Header } from './Header';
interface Ticket { id: string; title: string; status: string; }
interface Trip { id: string; origin: string; destination: string; status: string; }
const TicketIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-2-2H5z"></path></svg>;
const FleetIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8a1 1 0 001-1zM3 11h10"></path></svg>;
export function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  useEffect(() => {
    fetch('http://localhost:3001/tickets' ).then(res => res.json()).then(data => setTickets(data)).catch(err => console.error("Falha ao buscar tickets de TI:", err));
    fetch('http://localhost:3002/trips' ).then(res => res.json()).then(data => setTrips(data)).catch(err => console.error("Falha ao buscar viagens:", err));
  }, []);
  const openTickets = tickets.filter(t => t.status === 'OPEN').length;
  const tripsInProgress = trips.filter(t => t.status === 'IN_PROGRESS').length;
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Operacional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card title="TI Service Desk" count={tickets.length} icon={<TicketIcon />} buttonText="Novo Chamado">
            <p><strong>{openTickets}</strong> chamados em aberto.</p>
            <p>Último chamado: {tickets.length > 0 ? tickets[tickets.length - 1].title : 'N/A'}</p>
          </Card>
          <Card title="Gestão de Frota" count={trips.length} icon={<FleetIcon />} buttonText="Nova Viagem">
             <p><strong>{tripsInProgress}</strong> viagens em andamento.</p>
             <p>Última viagem: {trips.length > 0 ? \`\${trips[trips.length - 1].origin} → \${trips[trips.length - 1].destination}\` : 'N/A'}</p>
          </Card>
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-2"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
            <h3 className="text-lg font-semibold text-gray-500">Próximo Módulo</h3>
            <p className="text-sm text-gray-400">(Ex: RH, Financeiro...)</p>
          </div>
        </div>
      </main>
    </div>
  );
}`;
fs.writeFileSync(path.join(componentsPath, 'Dashboard.tsx'), dashboardContent.trim());

const appTsxContent = `
import { Dashboard } from './components/Dashboard';
function App() { return <Dashboard />; }
export default App;`;
fs.writeFileSync(path.join(srcPath, 'App.tsx'), appTsxContent.trim());

// 7. Salvar no GitHub
console.log('\n>> Etapa 6: Salvando progresso no GitHub...');
run('git add .');
run('git commit -m "feat(webapp): create and setup web-app with functional dashboard"');
run('git push');

console.log('\n✅ SUCESSO! O projeto frontend foi criado e o dashboard está pronto.');
console.log("O script 'create-webapp.cjs' pode ser deletado.");
fs.unlinkSync('create-webapp.cjs');
