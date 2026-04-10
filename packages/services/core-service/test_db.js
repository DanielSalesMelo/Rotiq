const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:JXaYfLedIWpwfXXOFuRkhSityLMAfole@crossover.proxy.rlwy.net:40549/railway",
});
client.connect()
  .then(() => {
    console.log('Conexão bem-sucedida!');
    return client.end();
  })
  .catch(err => {
    console.error('Erro de conexão:', err.message);
    process.exit(1);
  });
