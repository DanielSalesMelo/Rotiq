"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const systemRouter_1 = require("./_core/systemRouter");
const trpc_1 = require("./_core/trpc");
const veiculos_1 = require("./routers/veiculos");
const funcionarios_1 = require("./routers/funcionarios");
const frota_1 = require("./routers/frota");
const financeiro_1 = require("./routers/financeiro");
const dashboard_1 = require("./routers/dashboard");
const viagens_1 = require("./routers/viagens");
const custos_1 = require("./routers/custos");
const multas_1 = require("./routers/multas");
const auth_1 = require("./routers/auth");
const users_1 = require("./routers/users");
const chat_1 = require("./routers/chat");
exports.appRouter = (0, trpc_1.router)({
    system: systemRouter_1.systemRouter,
    auth: auth_1.authRouter,
    users: users_1.usersRouter,
    chat: chat_1.chatRouter,
    veiculos: veiculos_1.veiculosRouter,
    funcionarios: funcionarios_1.funcionariosRouter,
    frota: frota_1.frotaRouter,
    financeiro: financeiro_1.financeiroRouter,
    dashboard: dashboard_1.dashboardRouter,
    viagens: viagens_1.viagensRouter,
    custos: custos_1.custosRouter,
    multas: multas_1.multasRouter,
});
