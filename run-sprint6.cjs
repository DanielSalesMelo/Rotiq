// Script Mestre para configurar o Sprint 6: Relacionamentos e Viagens no Módulo Frota
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

const dbSchemaPath = './packages/shared-libs/db-schemas/prisma/schema.prisma';
const fleetServerPath = './packages/services/fleet/src/server.ts';

console.log("--- INICIANDO SPRINT 6: VIAGENS E RELACIONAMENTOS ---");

// 1. Adicionar o modelo Trip e os relacionamentos ao schema.prisma
console.log('\n>> Etapa 1: Adicionando modelo Trip e relacionamentos ao schema.prisma...');
const tripModel = `
// Modelo de Viagem para o Módulo Frota
model Trip {
  id            String    @id @default(cuid())
  origin        String
  destination   String
  startDate     DateTime  @default(now())
  endDate       DateTime?
  status        String    @default("IN_PROGRESS") // IN_PROGRESS, COMPLETED, CANCELED

  // Relacionamentos
  driverId      String
  driver        Driver    @relation(fields: [driverId], references: [id])

  vehicleId     String
  vehicle       Vehicle   @relation(fields: [vehicleId], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
`;
// Adiciona o campo de relacionamento nos modelos existentes
let schemaContent = fs.readFileSync(dbSchemaPath, 'utf8');
schemaContent = schemaContent.replace(/(model Vehicle {[^}]*)}/, '$1\n  trips           Trip[]\n}');
schemaContent = schemaContent.replace(/(model Driver {[^}]*)}/, '$1\n  trips           Trip[]\n}');
fs.writeFileSync(dbSchemaPath, schemaContent + tripModel);
console.log('>> Modelo Trip e relacionamentos adicionados com sucesso.');

// 2. Executar a migração para criar a tabela Trip
console.log('\n>> Etapa 2: Executando a migração do banco de dados...');
run(`pnpm exec prisma migrate dev --name add_trip_model --schema=${dbSchemaPath}`);

// 3. Adicionar endpoints de Viagem à API de Frota
console.log('\n>> Etapa 3: Adicionando endpoints de Viagem à API...');
const tripEndpoints = `
// --- Rotas de Viagens ---
app.post('/trips', async (req: Request, res: Response) => {
  try {
    const { driverId, vehicleId, ...tripData } = req.body;
    const newTrip = await prisma.trip.create({
      data: {
        ...tripData,
        driver: { connect: { id: driverId } },
        vehicle: { connect: { id: vehicleId } },
      },
      include: { // Inclui os dados do motorista e do veículo na resposta
        driver: true,
        vehicle: true,
      }
    });
    res.status(201).json(newTrip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao criar viagem', details: error });
  }
});

app.get('/trips', async (req: Request, res: Response) => {
  const trips = await prisma.trip.findMany({
    include: {
      driver: true,
      vehicle: true,
    }
  });
  res.status(200).json(trips);
});
`;
let serverContent = fs.readFileSync(fleetServerPath, 'utf8');
const listenIndex = serverContent.lastIndexOf('app.listen');
serverContent = serverContent.slice(0, listenIndex) + tripEndpoints + serverContent.slice(listenIndex);
fs.writeFileSync(fleetServerPath, serverContent);
console.log('>> Endpoints de Viagem adicionados com sucesso.');

// 4. Salvar no GitHub
console.log('\n>> Etapa 4: Salvando progresso no GitHub...');
run('git add .');
run('git commit -m "feat(fleet): add trip model and endpoints with relationships"');
run('git push');

console.log('\n✅ SUCESSO! Sprint 6 concluído. O Módulo Frota agora gerencia Viagens.');
console.log("O script 'run-sprint6.cjs' pode ser deletado.");
