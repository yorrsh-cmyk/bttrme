import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit runs locally; .env.local holds the Neon URL for the target branch
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
