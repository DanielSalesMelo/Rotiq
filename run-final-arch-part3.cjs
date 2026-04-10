const fs = require('fs');
const { execSync } = require('child_process');
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

console.log("🚀 INICIANDO ARQUITETURA DEFINITIVA (Parte 3 de 3) 🚀");
try {
    console.log("--- Etapa 4: Finalizando e Salvando ---");
    run(`pnpm install`);
    run('git add .');
    run('git commit -m "feat(arch): implement the definitive v2 architecture"');
    run('git push');
    console.log("✅ Progresso salvo no GitHub.");

    console.log("\n🏁 SUCESSO! ARQUITETURA DEFINITIVA CONCLUÍDA.");
    
    fs.unlinkSync('run-final-arch-part1.cjs');
    fs.unlinkSync('run-final-arch-part2.cjs');
    fs.unlinkSync('run-final-arch-part3.cjs');
} catch (e) {
    console.error("🚨 Erro na Parte 3:", e.message);
}
