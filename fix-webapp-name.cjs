const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("--- CORRIGINDO NOME DO PACOTE DO WEB-APP ---");

const webAppPackageJsonPath = 'packages/apps/web-app/package.json';

try {
    // 1. Ler o package.json do web-app
    console.log('>> Lendo o package.json do web-app...');
    let packageJson = JSON.parse(fs.readFileSync(webAppPackageJsonPath, 'utf8'));

    // 2. Corrigir o nome
    const oldName = packageJson.name;
    const newName = '@nexcore/web-app';
    
    if (oldName === newName) {
        console.log('>> O nome do pacote já está correto. Nenhuma alteração necessária.');
    } else {
        packageJson.name = newName;
        console.log(`>> Alterando nome de "${oldName}" para "${newName}"...`);
        
        // 3. Salvar o arquivo modificado
        fs.writeFileSync(webAppPackageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('>> Nome do pacote corrigido com sucesso!');
    }

    // 4. Salvar a correção no GitHub
    console.log('\n>> Salvando correção no GitHub...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "fix(webapp): correct package name to @nexcore/web-app"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });

    console.log('\n✅ SUCESSO! O nome do pacote foi corrigido e salvo.');
    console.log("Agora você pode iniciar o servidor do frontend.");

} catch (error) {
    console.error('\n❌ Falha ao executar o script de correção:', error.message);
    process.exit(1);
} finally {
    // Deleta o próprio script de correção
    fs.unlinkSync('fix-webapp-name.cjs');
}
