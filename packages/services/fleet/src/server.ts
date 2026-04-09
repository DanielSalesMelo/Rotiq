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


// --- Rotas de Viagens ---
app.post('/trips', async (req: Request, res: Response) => {
  try {
    const { driverId, vehicleId, ...tripData } = req.body;
    const newTrip = await prisma.trip.create({
      data: {
        ...tripData,
        driver: { connect: { id: driverId } },
        vehicle: { connect: { id: vehicleId } },
      },
      include: { // Inclui os dados do motorista e do veículo na resposta
        driver: true,
        vehicle: true,
      }
    });
    res.status(201).json(newTrip);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao criar viagem', details: error });
  }
});

app.get('/trips', async (req: Request, res: Response) => {
  const trips = await prisma.trip.findMany({
    include: {
      driver: true,
      vehicle: true,
    }
  });
  res.status(200).json(trips);
});
app.listen(PORT, () => {
  console.log(`🚀 Servidor do Módulo de Frota rodando na porta ${PORT}`);
});