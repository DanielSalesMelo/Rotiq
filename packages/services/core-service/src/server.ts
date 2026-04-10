
import express from 'express';
import { PrismaClient } from '@prisma/client';
const app = express();
const prisma = new PrismaClient();
const PORT = 3000;
app.use(express.json());
app.post('/tenants', async (req, res) => { try { const t = await prisma.tenant.create({ data: req.body }); res.status(201).json(t); } catch (e) { res.status(400).json({ error: 'Erro.' }); } });
app.post('/companies', async (req, res) => { try { const c = await prisma.company.create({ data: req.body }); res.status(201).json(c); } catch (e) { res.status(400).json({ error: 'Erro.' }); } });
app.listen(PORT, () => { console.log(`🏛️  Servidor do Módulo Core rodando na porta ${PORT}`); });
