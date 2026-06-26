#!/usr/bin/env node
/**
 * First-time setup: .env file + Prisma client generation.
 * Run from repo root: npm run setup
 */
import { copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');
const envExample = join(root, '.env.example');

console.log('\n=== Tanko — configuración inicial ===\n');

if (!existsSync(envPath)) {
  if (!existsSync(envExample)) {
    console.error('No se encontró .env.example. Revisa el repositorio.');
    process.exit(1);
  }
  copyFileSync(envExample, envPath);
  console.log('✓ Creado .env desde .env.example');
} else {
  console.log('✓ .env ya existe');
}

console.log('\nGenerando cliente Prisma...');
const gen = spawnSync('npm', ['run', 'db:generate', '--workspace=backend'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (gen.status !== 0) {
  console.error('\n✗ Falló prisma generate. Revisa DATABASE_URL en .env');
  process.exit(gen.status ?? 1);
}

console.log(`
=== Siguiente paso: base de datos PostgreSQL ===

Opción A — Docker (recomendado si tienes Docker Desktop):
  docker compose up -d
  npm run db:setup

Opción B — PostgreSQL ya instalado en Windows:
  1. Crea la base "tanko_db" (pgAdmin o psql).
  2. Ajusta DATABASE_URL en .env con tu usuario y contraseña reales.
  3. npm run db:setup

Opcional (escrow real en testnet):
  - TRUSTLESS_WORK_API_KEY en .env
  - Extensión Freighter en testnet: https://freighter.app

Arrancar la app:
  npm run dev

URLs:
  - Frontend: http://localhost:3000
  - Backend:  http://localhost:3001/health
`);
