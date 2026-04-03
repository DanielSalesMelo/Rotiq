"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const trpc_1 = require("../_core/trpc");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const server_1 = require("@trpc/server");
exports.chatRouter = (0, trpc_1.router)({
    // Listar conversas do usuário logado
    listConversations: trpc_1.publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const db = await (0, db_1.getDb)();
        if (!db)
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Buscar conversas onde o usuário é membro
        const userConversations = await db
            .select({
            id: schema_1.chatConversations.id,
            name: schema_1.chatConversations.name,
            isGroup: schema_1.chatConversations.isGroup,
            lastMessageAt: schema_1.chatConversations.lastMessageAt,
        })
            .from(schema_1.chatConversations)
            .innerJoin(schema_1.chatMembers, (0, drizzle_orm_1.eq)(schema_1.chatConversations.id, schema_1.chatMembers.conversationId))
            .where((0, drizzle_orm_1.eq)(schema_1.chatMembers.userId, ctx.user.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatConversations.lastMessageAt));
        // Para cada conversa, buscar o outro participante (se não for grupo)
        const conversationsWithDetails = await Promise.all(userConversations.map(async (conv) => {
            if (!conv.isGroup) {
                const otherMembers = await db
                    .select({
                    name: schema_1.users.name,
                    lastName: schema_1.users.lastName,
                    email: schema_1.users.email,
                })
                    .from(schema_1.chatMembers)
                    .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.chatMembers.userId, schema_1.users.id))
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMembers.conversationId, conv.id), (0, drizzle_orm_1.sql) `${schema_1.chatMembers.userId} != ${ctx.user.id}`))
                    .limit(1);
                const otherMember = otherMembers[0];
                return {
                    ...conv,
                    displayName: otherMember ? `${otherMember.name} ${otherMember.lastName || ""}` : "Usuário",
                };
            }
            return { ...conv, displayName: conv.name || "Grupo" };
        }));
        return conversationsWithDetails;
    }),
    // Listar mensagens de uma conversa
    listMessages: trpc_1.publicProcedure
        .input(zod_1.z.object({ conversationId: zod_1.z.number() }))
        .query(async ({ input, ctx }) => {
        if (!ctx.user)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const db = await (0, db_1.getDb)();
        if (!db)
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Verificar se o usuário é membro da conversa
        const isMemberResult = await db
            .select()
            .from(schema_1.chatMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.chatMembers.conversationId, input.conversationId), (0, drizzle_orm_1.eq)(schema_1.chatMembers.userId, ctx.user.id)))
            .limit(1);
        if (isMemberResult.length === 0)
            throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Você não faz parte desta conversa" });
        const messages = await db
            .select({
            id: schema_1.chatMessages.id,
            content: schema_1.chatMessages.content,
            senderId: schema_1.chatMessages.senderId,
            createdAt: schema_1.chatMessages.createdAt,
            senderName: schema_1.users.name,
        })
            .from(schema_1.chatMessages)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.chatMessages.senderId, schema_1.users.id))
            .where((0, drizzle_orm_1.eq)(schema_1.chatMessages.conversationId, input.conversationId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.chatMessages.createdAt))
            .limit(50);
        return messages.reverse();
    }),
    // Enviar mensagem
    sendMessage: trpc_1.publicProcedure
        .input(zod_1.z.object({
        conversationId: zod_1.z.number(),
        content: zod_1.z.string().min(1),
    }))
        .mutation(async ({ input, ctx }) => {
        if (!ctx.user)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const db = await (0, db_1.getDb)();
        if (!db)
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Inserir mensagem
        await db.insert(schema_1.chatMessages).values({
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            content: input.content,
        });
        // Atualizar timestamp da conversa
        await db
            .update(schema_1.chatConversations)
            .set({ lastMessageAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.chatConversations.id, input.conversationId));
        return { success: true };
    }),
    // Iniciar ou buscar conversa privada com outro usuário
    getOrCreatePrivateConversation: trpc_1.publicProcedure
        .input(zod_1.z.object({ targetUserId: zod_1.z.number() }))
        .mutation(async ({ input, ctx }) => {
        if (!ctx.user)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const db = await (0, db_1.getDb)();
        if (!db)
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Buscar se já existe uma conversa privada entre os dois
        const existingConv = await db.execute((0, drizzle_orm_1.sql) `
        SELECT c.id 
        FROM chat_conversations c
        JOIN chat_members m1 ON c.id = m1."conversationId"
        JOIN chat_members m2 ON c.id = m2."conversationId"
        WHERE c."isGroup" = false
        AND m1."userId" = ${ctx.user.id}
        AND m2."userId" = ${input.targetUserId}
        LIMIT 1
      `);
        if (existingConv.length > 0) {
            return { conversationId: Number(existingConv[0].id) };
        }
        // Criar nova conversa
        const newConvResult = await db.insert(schema_1.chatConversations).values({
            empresaId: 1, // Default para agora
            isGroup: false,
        }).returning();
        const newConv = newConvResult[0];
        // Adicionar membros
        await db.insert(schema_1.chatMembers).values([
            { conversationId: newConv.id, userId: ctx.user.id },
            { conversationId: newConv.id, userId: input.targetUserId },
        ]);
        return { conversationId: newConv.id };
    }),
    // Listar todos os usuários para iniciar novo chat
    listUsers: trpc_1.publicProcedure.query(async ({ ctx }) => {
        if (!ctx.user)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const db = await (0, db_1.getDb)();
        if (!db)
            throw new server_1.TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            lastName: schema_1.users.lastName,
            email: schema_1.users.email,
        })
            .from(schema_1.users)
            .where((0, drizzle_orm_1.sql) `${schema_1.users.id} != ${ctx.user.id}`)
            .limit(100);
    }),
});
