
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(express.json());

// --- ROTAS DE TENANTS ---
app.post('/tenants', async (req, res) => {
  try {
    const tenant = await prisma.tenant.create({ data: req.body });
    res.status(201).json(tenant);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar tenant.' });
  }
});

// --- ROTAS DE COMPANIES ---
app.post('/companies', async (req, res) => {
  try {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar company.' });
  }
});

// --- ROTAS DE USERS (A ROTA QUE FALTAVA) ---
app.post('/users', async (req, res) => {
  try {
    // No futuro, aqui teremos a lógica para criptografar a senha (hashing)
    const user = await prisma.user.create({ data: req.body });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar usuário.' });
  }
});

app.listen(PORT, () => {
  console.log(`🏛️ Servidor do Módulo Core (v2) rodando na porta ${PORT}`);
});
