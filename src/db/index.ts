import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and paste the Neon connection string.",
  );
}

/** Neon over HTTP: no connection pool to manage, which suits serverless functions. */
export const db = drizzle(neon(url), { schema, casing: "snake_case" });
export { schema };
