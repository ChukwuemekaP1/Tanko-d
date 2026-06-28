import dotenv from "dotenv";
import path from "path";
import { defineConfig, env } from "prisma/config";

// Monorepo: .env lives at repo root (one level above backend/).
const repoRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    path: "./prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL") || "postgresql://postgres:postgres@localhost:5432/tanko_dev?schema=public",
  },
});
