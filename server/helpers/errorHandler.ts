import { TRPCError } from "@trpc/server";

/**
 * Mapeia erros técnicos do MySQL/banco para mensagens amigáveis em português.
 * Nunca expõe detalhes técnicos ao usuário final.
 * Registra o erro original no console para diagnóstico interno.
 */
export function handleDbError(err: unknown, context?: string): never {
  const raw = err instanceof Error ? err.message : String(err);
  const ctx = context ? `[${context}] ` : "";

  // Log interno — visível nos logs do servidor, nunca no frontend
  console.error(`${ctx}DB Error:`, raw);

  // Mapear códigos MySQL para mensagens amigáveis
  if (raw.includes("ER_DUP_ENTRY") || raw.includes("Duplicate entry")) {
    // Tentar identificar qual campo duplicou
    if (raw.includes("placa")) {
      throw new TRPCError({ code: "CONFLICT", message: "Esta placa já está cadastrada no sistema." });
    }
    if (raw.includes("cpf")) {
      throw new TRPCError({ code: "CONFLICT", message: "Este CPF já está cadastrado no sistema." });
    }
    if (raw.includes("cnpj")) {
      throw new TRPCError({ code: "CONFLICT", message: "Este CNPJ já está cadastrado no sistema." });
    }
    if (raw.includes("email")) {
      throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já está cadastrado no sistema." });
    }
    throw new TRPCError({ code: "CONFLICT", message: "Este registro já existe no sistema. Verifique os dados e tente novamente." });
  }

  if (raw.includes("ER_NO_REFERENCED_ROW") || raw.includes("foreign key constraint")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Registro relacionado não encontrado. Verifique os dados selecionados." });
  }

  if (raw.includes("ER_ROW_IS_REFERENCED") || raw.includes("Cannot delete")) {
    throw new TRPCError({ code: "CONFLICT", message: "Este registro não pode ser removido pois está sendo usado em outro lugar do sistema." });
  }

  if (raw.includes("ER_DATA_TOO_LONG") || raw.includes("Data too long")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Um dos campos contém texto muito longo. Reduza o conteúdo e tente novamente." });
  }

  if (raw.includes("ER_TRUNCATED_WRONG_VALUE") || raw.includes("Incorrect") || raw.includes("invalid")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Um dos valores informados é inválido. Verifique os campos e tente novamente." });
  }

  if (raw.includes("ECONNREFUSED") || raw.includes("ETIMEDOUT") || raw.includes("connect")) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha na conexão com o banco de dados. Tente novamente em alguns instantes." });
  }

  if (raw.includes("ER_LOCK_DEADLOCK") || raw.includes("deadlock")) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Conflito de acesso simultâneo. Tente novamente." });
  }

  // Erro genérico — nunca expõe detalhes técnicos
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Ocorreu um erro inesperado. Nossa equipe foi notificada. Tente novamente em alguns instantes.",
  });
}

/**
 * Wrapper seguro para operações de banco.
 * Captura qualquer erro e converte para mensagem amigável.
 */
export async function safeDb<T>(fn: () => Promise<T>, context?: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof TRPCError) throw err; // Re-throw TRPC errors (already friendly)
    handleDbError(err, context);
  }
}

/**
 * Valida que o banco está disponível antes de prosseguir.
 */
export function requireDb<T>(db: T | null, context?: string): T {
  if (!db) {
    console.error(`[${context ?? "DB"}] Database connection unavailable`);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Sistema temporariamente indisponível. Tente novamente em alguns instantes.",
    });
  }
  return db;
}
