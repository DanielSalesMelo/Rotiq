const fs = require('fs');
console.log("🚀 INICIANDO EVOLUÇÃO DO MÓDULO DE TI (Parte 1 de 2) 🚀");
console.log("--- Etapa 1: Evoluindo o Schema do Banco de Dados ---");

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
  createdTickets Ticket[] @relation("CreatedTickets")
  assignedTickets Ticket[] @relation("AssignedTickets")
  comments    TicketComment[]
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

// --- Módulo de TI Service Desk (VERSÃO MELHORADA) ---
enum TicketStatus { OPEN, IN_PROGRESS, PENDING_USER, RESOLVED, CLOSED }
enum TicketPriority { LOW, MEDIUM, HIGH, CRITICAL }

model Ticket {
  id                String          @id @default(cuid())
  title             String
  description       String?
  status            TicketStatus    @default(OPEN)
  priority          TicketPriority  @default(MEDIUM)
  
  company           Company         @relation(fields: [companyId], references: [id])
  companyId         String

  requester         User            @relation("CreatedTickets", fields: [requesterId], references: [id])
  requesterId       String
  
  assignee          User?           @relation("AssignedTickets", fields: [assigneeId], references: [id])
  assigneeId        String?

  category          TicketCategory? @relation(fields: [categoryId], references: [id])
  categoryId        String?

  comments          TicketComment[]
  satisfactionRating Int?           @db.SmallInt // Nota de 1 a 5
  
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model TicketCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  tickets     Ticket[]
}

model TicketComment {
  id        String   @id @default(cuid())
  content   String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  ticketId  String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  // Anexos podem ser um array de strings (URLs) ou uma relação com um modelo 'Attachment'
  attachments String[]
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
    console.log("✅ Schema.prisma evoluído com as melhorias do Módulo de TI.");
    console.log("\n🏁 FIM DA PARTE 1. Execute a Parte 2 para continuar. 🏁");
} catch (e) {
    console.error("🚨 Erro na Parte 1:", e.message);
}
