
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

import express from 'express';

const app = express();

Sentry.init({
  dsn: "https://957618949ffa16249287972895a19cde@o4511192032739328.ingest.us.sentry.io/4511192079925248",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

const PORT = process.env.PORT || 3002;

app.use(express.json());

app.get('/tickets', (req, res) => {
    res.json([{ id: 1, title: "Impressora quebrada" }]);
});

app.post('/tickets', (req, res) => {
    res.status(201).json({ message: "Ticket criado", data: req.body });
});


app.use(Sentry.Handlers.errorHandler());

app.listen(PORT, () => {
    console.log(`🚀 Módulo de TI rodando na porta ${PORT}`);
});