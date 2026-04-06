import { Pool } from "pg";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DATABASE_URL = process.env.DATABASE_URL;
const STATE_ROW_ID = "skybridge-state";
const LOCAL_STATE_FILE = resolve(process.cwd(), "data", "app-state.json");

function isPostgresUrl(value: string | undefined) {
  return Boolean(value && (value.startsWith("postgres://") || value.startsWith("postgresql://")));
}

let pool: Pool | null = null;

function getPool() {
  if (!isPostgresUrl(DATABASE_URL)) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
    });
  }

  return pool;
}

export function hasDatabase() {
  return isPostgresUrl(DATABASE_URL);
}

export async function initPersistence(seedPayload: unknown) {
  const currentPool = getPool();
  if (!currentPool) {
    try {
      const content = await readFile(LOCAL_STATE_FILE, "utf8");
      return JSON.parse(content);
    } catch {
      await mkdir(dirname(LOCAL_STATE_FILE), { recursive: true });
      await writeFile(LOCAL_STATE_FILE, JSON.stringify(seedPayload, null, 2), "utf8");
      return seedPayload;
    }
  }

  await currentPool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const existing = await currentPool.query("SELECT payload FROM app_state WHERE id = $1", [STATE_ROW_ID]);
  if (existing.rowCount && existing.rows[0]?.payload) {
    return existing.rows[0].payload;
  }

  await currentPool.query(
    "INSERT INTO app_state (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
    [STATE_ROW_ID, JSON.stringify(seedPayload)],
  );

  return seedPayload;
}

export async function persistState(payload: unknown) {
  const currentPool = getPool();
  if (!currentPool) {
    await mkdir(dirname(LOCAL_STATE_FILE), { recursive: true });
    await writeFile(LOCAL_STATE_FILE, JSON.stringify(payload, null, 2), "utf8");
    return;
  }

  await currentPool.query(
    "INSERT INTO app_state (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
    [STATE_ROW_ID, JSON.stringify(payload)],
  );
}
