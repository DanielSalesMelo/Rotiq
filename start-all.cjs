const { exec } = require('child_process');
const path = require('path');

console.log("🚀 Iniciando todos os serviços do NexCore (versão compatível com Windows)...");

// Constrói o caminho para o web-app de forma segura
const webAppPath = path.join('packages', 'apps', 'web-app');

const commands = [
  { name: "TI-API", command: "pnpm --filter @nexcore/ti-desk-service dev", color: "bgCyan.black" },
  { name: "FROTA-API", command: "pnpm --filter @nexcore/fleet dev", color: "bgGreen.black" },
  // Comando corrigido para o WEB-APP: usa o caminho correto para o Windows
  { name: "WEB-APP", command: `cd ${webAppPath} && pnpm dev`, color: "bgMagenta.black" }
];

const concurrentlyCommand = `pnpm exec concurrently --names "${commands.map(c => c.name).join(',')}" -c "${commands.map(c => c.color).join(',')}" ${commands.map(c => `"${c.command}"`).join(' ')}`;

const child = exec(concurrentlyCommand);
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Um dos serviços falhou. Código de saída: ${code}`);
  }
});
