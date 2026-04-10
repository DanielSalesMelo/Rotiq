const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 RE-EXECUTANDO EVOLUÇÃO DO MÓDULO DE TI (Parte 2 de 2) 🚀");

const run = (command) => execSync(command, { stdio: 'inherit' });
const schemaPath = 'packages/shared-libs/db-schemas/prisma/schema.prisma';
const tiServerPath = 'packages/services/ti-desk/src/server.ts';

const newApiCode = `
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(express.json());

// --- ROTAS DE TICKETS ---

// Listar todos os tickets com detalhes (requester, assignee, categoria)
app.get('/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        category: true,
      },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tickets.' });
  }
});

// Criar um novo ticket (agora com mais inteligência)
app.post('/tickets', async (req, res) => {
  const { title, description, companyId, requesterId, priority, categoryId } = req.body;
  if (!title || !companyId || !requesterId) {
    return res.status(400).json({ error: 'Título, companyId e requesterId são obrigatórios.' });
  }
  try {
    const ticket = await prisma.ticket.create({
      data: { title, description, companyId, requesterId, priority, categoryId },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar ticket. Verifique se os IDs fornecidos são válidos.' });
  }
});

// --- ROTAS DE COMENTÁRIOS (CHAT) ---

// Adicionar um comentário a um ticket
app.post('/tickets/:ticketId/comments', async (req, res) => {
  const { ticketId } = req.params;
  const { content, authorId, attachments } = req.body;
  if (!content || !authorId) {
    return res.status(400).json({ error: 'Conteúdo e authorId são obrigatórios.' });
  }
  try {
    const comment = await prisma.ticketComment.create({
      data: { content, authorId, ticketId, attachments },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao adicionar comentário.' });
  }
});

// Listar comentários de um ticket
app.get('/tickets/:ticketId/comments', async (req, res) => {
  const { ticketId } = req.params;
  try {
    const comments = await prisma.ticketComment.findMany({
      where: { ticketId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
});


// --- ROTAS DE CATEGORIAS ---

// Criar uma nova categoria de ticket
app.post('/ticket-categories', async (req, res) => {
  try {
    const category = await prisma.ticketCategory.create({ data: req.body });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar categoria.' });
  }
});

// Listar todas as categorias
app.get('/ticket-categories', async (req, res) => {
  try {
    const categories = await prisma.ticketCategory.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});


app.listen(PORT, () => {
  console.log(\`🚀 Servidor do Módulo de TI (v2) rodando na porta \${PORT}\`);
});
`;

try {
    console.log("--- Etapa 2: Sincronizando o Banco de Dados com o novo Schema ---");
    run(`pnpm exec prisma migrate dev --name "evolve_ti_module_v2" --schema=${schemaPath}`);
    console.log("✅ Banco de dados atualizado.");

    console.log("--- Etapa 3: Atualizando a API do TI Service Desk ---");
    fs.writeFileSync(tiServerPath, newApiCode);
    console.log("✅ Código da API de TI atualizado para a versão 2.");

    console.log("--- Etapa 4: Finalizando e Salvando ---");
    run('git add .');
    run('git commit -m "feat(ti-desk): evolve ti module with advanced features (v2 fix)"');
    run('git push');
    console.log("✅ Progresso salvo no GitHub.");

    console.log("\n🏁 SUCESSO! EVOLUÇÃO DO MÓDULO DE TI CONCLUÍDA.");
    
    // Limpa os scripts antigos
    if (fs.existsSync('run-ti-evolution-part1.cjs')) fs.unlinkSync('run-ti-evolution-part1.cjs');
    if (fs.existsSync('run-ti-evolution-part2.cjs')) fs.unlinkSync('run-ti-evolution-part2.cjs');

} catch (e) {
    console.error("🚨 Erro na Parte 2:", e.message);
    process.exit(1);
}
