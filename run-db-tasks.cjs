// Script Mestre para executar tarefas do Prisma, lendo o .env
const { execSync } = require('child_process');
const path = require('path');

// Carrega o .env manualmente
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const run = (command) => {
    console.log(`>> Executando: ${command}`);
    try {
        // Executa o comando usando o executável do Prisma dentro de node_modules
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`\n❌ Falha ao executar o comando.`);
        process.exit(1);
    }
};

const prismaExecutable = path.resolve(__dirname, 'node_modules/.bin/prisma');
const schemaPath = path.resolve(__dirname, 'packages/shared-libs/db-schemas/prisma/schema.prisma');

console.log('--- EXECUTANDO TAREFAS DO BANCO DE DADOS ---');

// 1. Executa a MIGRATION
console.log('\n>> Etapa 1: Executando a migração...');
run(`"${prismaExecutable}" migrate dev --schema="${schemaPath}" --name init`);

// 2. Gera o PRISMA CLIENT
console.log('\n>> Etapa 2: Gerando o Prisma Client...');
run(`"${prismaExecutable}" generate --schema="${schemaPath}"`);

console.log('\n✅ SUCESSO! Migração e geração do cliente concluídas.');
