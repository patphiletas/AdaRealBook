import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

// max: 1 — chaque invocation de route handler peut ouvrir sa propre connexion
// en environnement serverless, on évite ainsi d'épuiser le pool Neon.
export const sql =
  global.__sql ?? postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });

if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}
