"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeDb = safeDb;
exports.requireDb = requireDb;
async function safeDb(fn, context) {
    try {
        return await fn();
    }
    catch (error) {
        console.error(`[Database Error] in ${context}:`, error);
        throw error;
    }
}
function requireDb(db, context) {
    if (!db) {
        throw new Error(`[Database Error] Database not available in ${context}`);
    }
    return db;
}
