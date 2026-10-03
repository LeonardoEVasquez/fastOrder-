import { Pool } from "pg";

const globalForPg = globalThis;

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Si usas Neon o Supabase, descomenta esta línea:
    // ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;