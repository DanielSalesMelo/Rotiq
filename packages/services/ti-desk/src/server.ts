import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = process.env.PORT || 3001; // Porta para o serviço de TI

// Inicializa o Prisma Client
const prisma = new PrismaClient();

app.use(express.json());

// Rota para criar um novo ticket
app.post('/tickets', async (req: Request, res: Response) => {
  try {
    const { title, description, requesterId, priority } = req.body;

    if (!title || !requesterId) {
      return res.status(400).json({ error: 'Título e ID do solicitante são obrigatórios.' });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        requesterId,
        priority,
      },
    });

    res.status(201).json(newTicket);
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res.status(500).json({ error: 'Não foi possível criar o ticket.' });
  }
});

// Rota para listar todos os tickets
app.get('/tickets', async (req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(tickets);
  } catch (error) {
    console.error("Erro ao listar tickets:", error);
    res.status(500).json({ error: 'Não foi possível listar os tickets.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor do Módulo de TI rodando na porta ${PORT}`);
});