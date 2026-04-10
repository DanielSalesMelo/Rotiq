const { exec } = require('child_process');

console.log("🚀 Iniciando todos os serviços do NexCore (versão corrigida)...");

// Define os comandos para cada serviço
const commands = [
  { name: "TI-API", command: "pnpm --filter @nexcore/ti-desk-service dev", color: "bgCyan.black" },
  { name: "FROTA-API", command: "pnpm --filter @nexcore/fleet dev", color: "bgGreen.black" },
  { name: "WEB-APP", command: "pnpm --filter @nexcore/web-app dev", color: "bgMagenta.black" }
];

// Monta o comando final para o 'concurrently'
const concurrentlyCommand = `pnpm exec concurrently --names "${commands.map(c => c.name).join(',')}" -c "${commands.map(c => c.color).join(',')}" ${commands.map(c => `"${c.command}"`).join(' ')}`;

// Usa 'exec' (assíncrono) e conecta a saída ao terminal atual
const child = exec(concurrentlyCommand);

// Conecta a saída do processo filho (concurrently) ao nosso terminal
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Um dos serviços falhou. Código de saída: ${code}`);
  }
});
