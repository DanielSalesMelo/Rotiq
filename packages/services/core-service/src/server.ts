
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());

// Endpoints para gerenciar Tenants, Companies, Users, etc.
// Exemplo: Criar um Tenant
app.post('/tenants', async (req, res) => {
  try {
    const tenant = await prisma.tenant.create({ data: req.body });
    res.status(201).json(tenant);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar tenant.' });
  }
});

// Exemplo: Criar uma Company para um Tenant
app.post('/companies', async (req, res) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar company.' });
  }
});

app.listen(PORT, () => {
  console.log(`🏛️  Servidor do Módulo Core rodando na porta ${PORT}`);
});
