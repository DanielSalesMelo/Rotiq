const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// --- Funções de Utilidade ---
const run = (command, cwd = '.') => {
    console.log(`>> [${cwd}] Executando: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', cwd });
    } catch (error) {
        console.error(`\n❌ Falha ao executar o comando: ${command}`);
        process.exit(1);
    }
};

const replaceInFile = (filePath, oldText, newText) => {
    if (fs.existsSync(filePath)) {
        console.log(`>> Modificando ${filePath}`);
        let content = fs.readFileSync(filePath, 'utf8');
        // Usa uma expressão regular global para substituir todas as ocorrências
        const regex = new RegExp(oldText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        content = content.replace(regex, newText);
        fs.writeFileSync(filePath, content, 'utf8');
    } else {
        console.warn(`⚠️ Arquivo não encontrado para modificação: ${filePath}`);
    }
};

const createDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        console.log(`>> Criando diretório: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// --- Início do Script ---
console.log("🚀 INICIANDO SPRINT DE ARQUITETURA v2.0 (Parte 1) 🚀");

const schemaPath = 'packages/shared-libs/db-schemas/prisma/schema.prisma';

try {
    // --- Etapa 1: Limpar o schema antigo e criar a nova base ---
    console.log("\n--- Etapa 1: Recriando o Schema do Banco de Dados com a Arquitetura Core ---");

    const newSchemaContent = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// --- MÓDULO CORE: A FUNDAÇÃO DE TUDO ---

// O cliente que paga a conta. A entidade máxima.
model Tenant {
  id        String    @id @default(cuid())
  name      String    @unique // Ex: "Grupo Silva"
  companies Company[]
  users     User[]
  roles     Role[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// Uma empresa específica dentro do Tenant.
model Company {
  id        String   @id @default(cuid())
  name      String   // Ex: "Silva Transportes SP"
  cnpj      String?  @unique
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  tenantId  String
  units     Unit[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relações com os dados dos outros módulos
  tickets   Ticket[]
  vehicles  Vehicle[]
  drivers   Driver[]
  trips     Trip[]
}

// Uma filial ou unidade de negócio. Opcional.
model Unit {
  id        String   @id @default(cuid())
  name      String   // Ex: "Garagem Tietê"
  company   Company  @relation(fields: [companyId], references: [id])
  companyId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// O usuário que faz login.
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Armazenar hash
  name      String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  tenantId  String
  // Faltando a relação com Role e Company/Unit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// As funções/cargos DENTRO DO SISTEMA.
model Role {
  id            String       @id @default(cuid())
  name          String       // Ex: "Despachante", "Diretor"
  tenant        Tenant       @relation(fields: [tenantId], references: [id])
  tenantId      String
  permissions   Permission[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  @@unique([tenantId, name])
}

// As ações que podem ser feitas.
model Permission {
  id          String @id @default(cuid())
  name        String @unique // Ex: "trip:create", "trip:read_all", "employee:create"
  description String?
  roles       Role[]
}

// --- Módulo de TI Service Desk ---
model Ticket {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("OPEN") // OPEN, IN_PROGRESS, CLOSED
  company     Company  @relation(fields: [companyId], references: [id])
  companyId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// --- Módulo de Gestão de Frota ---
model Vehicle {
  id        String   @id @default(cuid())
  plate     String   @unique
  model     String
  brand     String
  year      Int
  status    String   @default("AVAILABLE") // AVAILABLE, IN_USE, MAINTENANCE
  company   Company  @relation(fields: [companyId], references: [id])
  companyId String
  trips     Trip[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Driver {
  id              String   @id @default(cuid())
  name            String
  licenseNumber   String   @unique
  licenseCategory String
  status          String   @default("ACTIVE") // ACTIVE, INACTIVE, ON_VACATION
  company         Company  @relation(fields: [companyId], references: [id])
  companyId       String
  trips           Trip[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Trip {
  id          String    @id @default(cuid())
  origin      String
  destination String
  startDate   DateTime  @default(now())
  endDate     DateTime?
  status      String    @default("IN_PROGRESS") // IN_PROGRESS, COMPLETED, CANCELED
  company     Company   @relation(fields: [companyId], references: [id])
  companyId   String
  driver      Driver    @relation(fields: [driverId], references: [id])
  driverId    String
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  vehicleId   String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
`;
    fs.writeFileSync(schemaPath, newSchemaContent);
    console.log("✅ Schema.prisma recriado com a nova arquitetura.");

    console.log("\n🏁 FIM DA PARTE 1. Execute a Parte 2 para continuar. 🏁");

} catch (error) {
    console.error("\n🚨 Ocorreu um erro durante a execução da Parte 1:", error.message);
    process.exit(1);
}
