// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing in your .env file");
}

export default defineConfig({
  schema: "./shared/schema.ts",     
  out: "./migrations",              // Directory for generated SQL files
  dialect: "postgresql",            // PostgreSQL dialect
  dbCredentials: {
    url: databaseUrl,
  },
});
