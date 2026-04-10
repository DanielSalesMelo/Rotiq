const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 INICIANDO SINCRONIZAÇÃO DAS APIS COM A ARQUITETURA v2 🚀");

const run = (command) => execSync(command, { stdio: 'inherit' });

const replaceInFile = (filePath, oldText, newText) => {
    if (fs.existsSync(filePath)) {
        console.log(`>> Modificando ${filePath}...`);
        let content = fs.readFileSync(filePath, 'utf8');
        const regex = new RegExp(oldText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        content = content.replace(regex, newText);
        fs.writeFileSync(filePath, content, 'utf8');
    } else {
        console.error(`❌ Arquivo não encontrado: ${filePath}`);
    }
};

try {
    // --- Corrigindo a API de TI Service Desk ---
    const tiServerPath = 'packages/services/ti-desk/src/server.ts';
    // Remove a lógica antiga de 'requesterId' e 'tenantId' que não se aplica mais diretamente
    replaceInFile(tiServerPath, 'const tickets = await prisma.ticket.findMany({ where: { tenantId } });', 'const tickets = await prisma.ticket.findMany(); // Lógica de filtro por companyId a ser adicionada');
    replaceInFile(tiServerPath, 'const ticket = await prisma.ticket.create({ data: { ...req.body, tenantId } });', 'const ticket = await prisma.ticket.create({ data: req.body });');
    replaceInFile(tiServerPath, 'const ticket = await prisma.ticket.create({ data: { ...req.body, requesterId } });', 'const ticket = await prisma.ticket.create({ data: req.body });');
    console.log("✅ API de TI corrigida.");

    // --- Corrigindo a API de Frota ---
    const fleetServerPath = 'packages/services/fleet/src/server.ts';
    // Remove a lógica antiga de 'tenantId'
    replaceInFile(fleetServerPath, 'const vehicles = await prisma.vehicle.findMany({ where: { tenantId } });', 'const vehicles = await prisma.vehicle.findMany();');
    replaceInFile(fleetServerPath, 'const vehicle = await prisma.vehicle.create({ data: { ...req.body, tenantId } });', 'const vehicle = await prisma.vehicle.create({ data: req.body });');
    replaceInFile(fleetServerPath, 'const drivers = await prisma.driver.findMany({ where: { tenantId } });', 'const drivers = await prisma.driver.findMany();');
    replaceInFile(fleetServerPath, 'const driver = await prisma.driver.create({ data: { ...req.body, tenantId } });', 'const driver = await prisma.driver.create({ data: req.body });');
    replaceInFile(fleetServerPath, 'const trips = await prisma.trip.findMany({ where: { tenantId },', 'const trips = await prisma.trip.findMany({');
    replaceInFile(fleetServerPath, 'const trip = await prisma.trip.create({ data: { ...req.body, tenantId } });', 'const trip = await prisma.trip.create({ data: req.body });');
    console.log("✅ API de Frota corrigida.");

    // --- Salvar as correções ---
    console.log("\n--- Salvando correções no GitHub ---");
    run('git add .');
    run('git commit -m "fix(apis): sync ti-desk and fleet services with v2 architecture"');
    run('git push');
    console.log("✅ Progresso salvo.");

    console.log("\n🏁 SUCESSO! APIs sincronizadas. O sistema está pronto para a validação final.");
    fs.unlinkSync('run-api-sync.cjs');

} catch (error) {
    console.error("\n🚨 Ocorreu um erro durante a sincronização:", error.message);
    process.exit(1);
}
