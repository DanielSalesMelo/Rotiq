"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const schema_1 = require("./drizzle/schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const drizzle_orm_1 = require("drizzle-orm");
async function seed() {
    const db = await (0, db_1.getDb)();
    if (!db) {
        console.error("Não foi possível conectar ao banco de dados.");
        process.exit(1);
    }
    console.log("Iniciando seed do banco de dados...");
    const email = "danielmoraessales@outlook.com.br";
    const password = "Dan124578@#";
    const name = "Daniel Sales";
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    try {
        // Verificar se o usuário já existe
        const [existingUser] = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email)).limit(1);
        if (existingUser) {
            console.log(`Usuário ${email} já existe. Atualizando para Master Admin...`);
            await db.update(schema_1.users)
                .set({
                role: "master_admin",
                status: "approved",
                password: hashedPassword,
                name: name
            })
                .where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        }
        else {
            console.log(`Criando usuário Master Admin: ${email}`);
            await db.insert(schema_1.users).values({
                email: email,
                password: hashedPassword,
                name: name,
                openId: `master_${Date.now()}`,
                role: "master_admin",
                status: "approved",
                loginMethod: "local",
            });
        }
        console.log("Seed concluído com sucesso!");
    }
    catch (error) {
        console.error("Erro durante o seed:", error);
    }
    finally {
        process.exit(0);
    }
}
seed();
