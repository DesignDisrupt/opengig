import { defineConfig } from "drizzle-kit";

// Next reads .env.local itself; drizzle-kit does not.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — fine for `db:generate`, which needs no database.
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
