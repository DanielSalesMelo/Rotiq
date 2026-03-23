import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { chatConversations, chatMessages, chatMembers, users } from "../../drizzle/schema";
import { eq, and, isNull, desc, sql, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { safeDb, requireDb } from "../helpers/errorHandler";

export const chatRouter = router({
  // Listar conversas do usuário logado
  listConversations: protectedProcedure
    .input(z.object({ empresaId: z.number() }))
    .query(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "chat.listConversations");
        const userId = ctx.user!.id;

        // Subquery para pegar IDs das conversas que o usuário participa
        const userConversations = await db.select({
          conversationId: chatMembers.conversationId
        }).from(chatMembers)
          .where(eq(chatMembers.userId, userId));

        if (userConversations.length === 0) return [];

        const convIds = userConversations.map(c => c.conversationId);

        // Buscar detalhes das conversas e o outro membro (se for 1:1)
        const conversations = await db.select({
          id: chatConversations.id,
          name: chatConversations.name,
          isGroup: chatConversations.isGroup,
          lastMessageAt: chatConversations.lastMessageAt,
        }).from(chatConversations)
          .where(and(
            inArray(chatConversations.id, convIds),
            eq(chatConversations.empresaId, input.empresaId),
            isNull(chatConversations.deletedAt)
          ))
          .orderBy(desc(chatConversations.lastMessageAt));

        // Para cada conversa 1:1, buscar o nome do outro usuário
        const result = await Promise.all(conversations.map(async (conv) => {
          if (!conv.isGroup) {
            const otherMember = await db.select({
              name: users.name,
              id: users.id
            }).from(chatMembers)
              .innerJoin(users, eq(chatMembers.userId, users.id))
              .where(and(
                eq(chatMembers.conversationId, conv.id),
                ne(chatMembers.userId, userId)
              ))
              .limit(1);
            
            return {
              ...conv,
              otherUserName: otherMember[0]?.name || "Usuário Desconhecido",
              otherUserId: otherMember[0]?.id
            };
          }
          return conv;
        }));

        return result;
      }, "chat.listConversations");
    }),

  // Listar mensagens de uma conversa
  listMessages: protectedProcedure
    .input(z.object({ conversationId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "chat.listMessages");
        return db.select({
          id: chatMessages.id,
          content: chatMessages.content,
          senderId: chatMessages.senderId,
          createdAt: chatMessages.createdAt,
          senderName: users.name,
        }).from(chatMessages)
          .innerJoin(users, eq(chatMessages.senderId, users.id))
          .where(and(
            eq(chatMessages.conversationId, input.conversationId),
            isNull(chatMessages.deletedAt)
          ))
          .orderBy(desc(chatMessages.createdAt))
          .limit(input.limit);
      }, "chat.listMessages");
    }),

  // Enviar mensagem
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "chat.sendMessage");
        const userId = ctx.user!.id;

        // Inserir mensagem
        const [result] = await db.insert(chatMessages).values({
          conversationId: input.conversationId,
          senderId: userId,
          content: input.content,
        });

        // Atualizar data da última mensagem na conversa
        await db.update(chatConversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(chatConversations.id, input.conversationId));

        return { id: (result as any).insertId };
      }, "chat.sendMessage");
    }),

  // Criar ou buscar conversa 1:1
  getOrCreateDirectConversation: protectedProcedure
    .input(z.object({ empresaId: z.number(), targetUserId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      return safeDb(async () => {
        const db = requireDb(await getDb(), "chat.getOrCreateDirectConversation");
        const userId = ctx.user!.id;

        // Tentar encontrar conversa existente entre os dois
        const existing = await db.execute(sql`
          SELECT c.id FROM chat_conversations c
          JOIN chat_members m1 ON c.id = m1.conversationId
          JOIN chat_members m2 ON c.id = m2.conversationId
          WHERE c.isGroup = false 
          AND c.empresaId = ${input.empresaId}
          AND m1.userId = ${userId}
          AND m2.userId = ${input.targetUserId}
          LIMIT 1
        `);

        if ((existing as any)[0]?.length > 0) {
          return { id: (existing as any)[0][0].id };
        }

        // Se não existir, criar nova
        const [convResult] = await db.insert(chatConversations).values({
          empresaId: input.empresaId,
          isGroup: false,
        });
        const convId = (convResult as any).insertId;

        // Adicionar os dois membros
        await db.insert(chatMembers).values([
          { conversationId: convId, userId: userId },
          { conversationId: convId, userId: input.targetUserId }
        ]);

        return { id: convId };
      }, "chat.getOrCreateDirectConversation");
    }),
});
