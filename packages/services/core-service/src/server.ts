import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas
app.use('/auth', authRoutes);
app.use('/', adminRoutes);

app.listen(PORT, () => {
  console.log(`🏛️ Servidor do Módulo Core (v2) rodando na porta ${PORT}`);
});
