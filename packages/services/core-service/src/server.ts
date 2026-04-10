
import express from 'express';
import { PrismaClient } from '@prisma/client';
const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
app.use(express.json());
app.post('/tenants', async (req, res) => { try { const tenant = await prisma.tenant.create({ data: req.body }); res.status(201).json(tenant); } catch (e) { res.status(400).json({ error: 'Erro ao criar tenant.' }); } });
app.post('/companies', async (req, res) => { try { const company = await prisma.company.create({ data: req.body }); res.status(201).json(company); } catch (e) { res.status(400).json({ error: 'Erro ao criar company.' }); } });
app.listen(PORT, () => { console.log(`🏛️  Servidor do Módulo Core rodando na porta ${PORT}`); });
