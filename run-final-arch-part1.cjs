const fs = require('fs');
console.log("🚀 INICIANDO ARQUITETURA DEFINITIVA (Parte 1 de 3) 🚀");
console.log("--- Etapa 1: Recriando o Schema do Banco de Dados com a Arquitetura Core ---");

const schemaPath = 'packages/shared-libs/db-schemas/prisma/schema.prisma';
const newSchemaContent = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}
// --- MÓDULO CORE: A FUNDAÇÃO DE TUDO (VERSÃO FINAL) ---
model Tenant {
  id         String       @id @default(cuid())
  name       String       @unique
  companies  Company[]
  users      Membership[]
  roles      Role[]
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
}
model Company {
  id         String       @id @default(cuid())
  name       String
  cnpj       String?      @unique
  tenant     Tenant       @relation(fields: [tenantId], references: [id])
  tenantId   String
  members    Membership[]
  tickets    Ticket[]
  vehicles   Vehicle[]
  drivers    Driver[]
  trips      Trip[]
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
}
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  password    String
  name        String
  memberships Membership[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
model Role {
  id          String       @id @default(cuid())
  name        String
  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  tenantId    String
  members     Membership[]
  permissions Permission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  @@unique([tenantId, name])
}
model Membership {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  role      Role     @relation(fields: [roleId], references: [id])
  roleId    String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  tenantId  String
  company   Company? @relation(fields: [companyId], references: [id])
  companyId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([userId, roleId, tenantId, companyId])
}
model Permission {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  roles       Role[]
}
// --- Módulo de TI Service Desk ---
model Ticket {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("OPEN")
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
  status    String   @default("AVAILABLE")
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
  status          String   @default("ACTIVE")
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
  status      String    @default("IN_PROGRESS")
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
try {
    fs.writeFileSync(schemaPath, newSchemaContent);
    console.log("✅ Schema.prisma recriado com a arquitetura definitiva.");
    console.log("\n🏁 FIM DA PARTE 1. Execute a Parte 2 para continuar. 🏁");
} catch (e) {
    console.error("🚨 Erro na Parte 1:", e.message);
}
