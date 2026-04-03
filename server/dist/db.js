"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.upsertUser = upsertUser;
exports.getUserByOpenId = getUserByOpenId;
exports.getAllUsers = getAllUsers;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.closeDb = closeDb;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Carrega o .env da raiz do projeto (um nível acima da pasta server)
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), "..", ".env") });
// Tenta carregar da pasta atual também como fallback
dotenv_1.default.config();
const drizzle_orm_1 = require("drizzle-orm");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema_1 = require("./drizzle/schema");
const env_1 = require("./_core/env");
let _db = null;
let _client = null;
// Lazily create the drizzle instance so local tooling can run without a DB.
async function getDb() {
    if (!_db && process.env.DATABASE_URL) {
        try {
            _client = (0, postgres_1.default)(process.env.DATABASE_URL);
            _db = (0, postgres_js_1.drizzle)(_client);
        }
        catch (error) {
            console.warn("[Database] Failed to connect:", error);
            _db = null;
            _client = null;
        }
    }
    return _db;
}
async function upsertUser(user) {
    if (!user.openId) {
        throw new Error("User openId is required for upsert");
    }
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot upsert user: database not available");
        return;
    }
    try {
        const values = {
            openId: user.openId,
        };
        const updateSet = {};
        const textFields = ["name", "lastName", "email", "phone", "loginMethod"];
        const assignNullable = (field) => {
            const value = user[field];
            if (value === undefined)
                return;
            const normalized = value ?? null;
            values[field] = normalized;
            updateSet[field] = normalized;
        };
        textFields.forEach(assignNullable);
        if (user.lastSignedIn !== undefined) {
            values.lastSignedIn = user.lastSignedIn;
            updateSet.lastSignedIn = user.lastSignedIn;
        }
        // Set role only on INSERT (new user), never overwrite existing role on UPDATE
        // This preserves roles manually set via Painel Master
        if (user.openId === env_1.ENV.ownerOpenId) {
            values.role = 'master_admin'; // Owner always starts as master_admin
        }
        else if (user.role !== undefined) {
            values.role = user.role; // Only set on initial insert, not on update
        }
        // Note: updateSet intentionally does NOT include role — never overwrite on login
        if (!values.lastSignedIn) {
            values.lastSignedIn = new Date();
        }
        if (Object.keys(updateSet).length === 0) {
            updateSet.lastSignedIn = new Date();
        }
        await db.insert(schema_1.users).values(values).onConflictDoUpdate({
            target: schema_1.users.openId,
            set: updateSet,
        });
    }
    catch (error) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
    }
}
async function getUserByOpenId(openId) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
    }
    const result = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
async function getAllUsers() {
    const db = await getDb();
    if (!db)
        return [];
    return await db.select().from(schema_1.users);
}
async function updateUser(id, data) {
    const db = await getDb();
    if (!db)
        return;
    await db.update(schema_1.users).set(data).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
}
async function deleteUser(id) {
    const db = await getDb();
    if (!db)
        return;
    await db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
}
async function closeDb() {
    if (_client) {
        await _client.end();
        _client = null;
        _db = null;
    }
}
