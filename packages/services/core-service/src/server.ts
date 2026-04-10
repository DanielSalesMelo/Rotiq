import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-para-dev';

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- ROTAS DE TENANTS ---
app.post('/tenants', async (req, res) => {
  try {
    const { name } = req.body;
    const tenant = await prisma.tenant.create({
      data: { name }
    });
    res.status(201).json(tenant);
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    res.status(400).json({ error: 'Erro ao criar tenant.', details: error instanceof Error ? error.message : error });
  }
});

// --- ROTAS DE COMPANIES ---
app.post('/companies', async (req, res) => {
  try {
    const { name, tenantId } = req.body;
    const company = await prisma.company.create({
      data: { name, tenantId }
    });
    res.status(201).json(company);
  } catch (error) {
    console.error('Erro ao criar company:', error);
    res.status(400).json({ error: 'Erro ao criar company.' });
  }
});

// --- ROTAS DE ROLES ---
app.post('/roles', async (req, res) => {
  try {
    const { name, tenantId } = req.body;
    const role = await prisma.role.create({
      data: { name, tenantId }
    });
    res.status(201).json(role);
  } catch (error) {
    console.error('Erro ao criar role:', error);
    res.status(400).json({ error: 'Erro ao criar role.' });
  }
});

// --- ROTAS DE AUTH ---
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, tenantId, companyId } = req.body;
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    // Buscar a role (ou criar se não existir, mas aqui assumimos que existe conforme o teste)
    let role = await prisma.role.findFirst({
      where: { name: 'USER', tenantId }
    });

    if (!role) {
      role = await prisma.role.create({
        data: { name: 'USER', tenantId }
      });
    }

    // Criar Membership
    await prisma.membership.create({
      data: {
        userId: user.id,
        tenantId,
        companyId,
        roleId: role.id
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(400).json({ error: 'Erro ao registrar usuário.' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            tenant: true,
            role: true
          }
        }
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        tenants: user.memberships.map(m => ({
          id: m.tenantId,
          role: m.role.name
        }))
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`🏛️ Servidor do Módulo Core (v2) rodando na porta ${PORT}`);
});
