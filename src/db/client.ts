import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon over HTTP: no connection pool to exhaust on the free tier (PRD 01 §9),
// works identically in Vercel functions and local `next dev`.

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

export const db = drizzle(neon(requireDatabaseUrl()), { schema });
