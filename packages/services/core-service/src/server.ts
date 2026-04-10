import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-secreto-padrao';

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(hpp());
app.use(mongoSanitize());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Muitas tentativas de login.', standardHeaders: true, legacyHeaders: false });

app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'Core-Service' }));

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(3), tenantId: z.string().cuid(), companyId: z.string().cuid() });
const loginSchema = z.object({ email: z.string().email(), password: z.string() });
const roleSchema = z.object({ name: z.string().min(3), tenantId: z.string().cuid() });

app.post('/auth/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    if (await prisma.user.findUnique({ where: { email: data.email } })) {
      return res.status(409).json({ message: 'Este email já está em uso.' });
    }
    const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
    if (!userRole) {
      return res.status(500).json({ message: "Role 'USER' não encontrado. Crie-o primeiro." });
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashedPassword, memberships: { create: { tenantId: data.tenantId, companyId: data.companyId, roleId: userRole.id } } },
      select: { id: true, name: true, email: true, memberships: { select: { role: true } } },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

app.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email }, include: { memberships: true } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const tenantId = user.memberships[0]?.tenantId;
    const token = jwt.sign({ userId: user.id, role: user.role, tenantId }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login bem-sucedido!', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

app.post('/roles', async (req, res) => {
  try {
    const data = roleSchema.parse(req.body);
    const role = await prisma.role.create({ data });
    res.status(201).json(role);
  } catch (error) {
    console.error("Erro em POST /roles:", error);
    res.status(500).json({ message: 'Erro ao criar role.', error });
  }
});

app.post('/tenants', async (req, res) => {
  const { name, plan } = req.body;
  const tenant = await prisma.tenant.create({ data: { name, plan } });
  res.json(tenant);
});

app.post('/companies', async (req, res) => {
  const { name, tenantId } = req.body;
  const company = await prisma.company.create({ data: { name, tenantId } });
  res.json(company);
});

app.listen(PORT, () => console.log(`🚀 Core-Service (com Segurança) rodando na porta ${PORT}`));