validarConvite: protectedProcedure
  .input(z.object({ codigo: z.string() }))
  .query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco indisponível" });

    const codigoUpper = input.codigo.trim().toUpperCase();
    const idNumerico = parseInt(input.codigo);

    const empresa = (await db
      .select({ id: empresas.id, nome: empresas.nome, codigoConvite: empresas.codigoConvite, ativo: empresas.ativo })
      .from(empresas)
      .where(
        and(
          isNull(empresas.deletedAt),
          eq(empresas.ativo, true),
          !isNaN(idNumerico)
            ? or(eq(empresas.id, idNumerico), eq(empresas.codigoConvite, codigoUpper))
            : eq(empresas.codigoConvite, codigoUpper)
        )
      )
      .limit(1)
    )[0];

    if (!empresa) {
      return { valido: false, empresa: null };
    }

    return {
      valido: true,
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        codigoConvite: empresa.codigoConvite,
      },
    };
  }),