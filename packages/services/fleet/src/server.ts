import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3002; // Porta para o serviço de Frota
const prisma = new PrismaClient();

app.use(express.json());

// --- Rotas de Veículos ---
app.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const newVehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao criar veículo', details: error });
  }
});

app.get('/vehicles', async (req: Request, res: Response) => {
  const vehicles = await prisma.vehicle.findMany();
  res.status(200).json(vehicles);
});

// --- Rotas de Motoristas ---
app.post('/drivers', async (req: Request, res: Response) => {
  try {
    const newDriver = await prisma.driver.create({ data: req.body });
    res.status(201).json(newDriver);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao criar motorista', details: error });
  }
});

app.get('/drivers', async (req: Request, res: Response) => {
  const drivers = await prisma.driver.findMany();
  res.status(200).json(drivers);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor do Módulo de Frota rodando na porta ${PORT}`);
});