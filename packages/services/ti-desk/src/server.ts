import express from 'express';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/tickets', (req, res) => {
    res.json([{ id: 1, title: "Impressora quebrada" }]);
});

app.post('/tickets', (req, res) => {
    res.status(201).json({ message: "Ticket criado", data: req.body });
});

app.listen(PORT, () => {
    console.log(`🚀 Módulo de TI rodando na porta ${PORT}`);
});