import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const STATE_ROW_ID = "skybridge-state";

let pool: Pool | null = null;

function getPool() {
  if (!DATABASE_URL) {
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
  return Boolean(DATABASE_URL);
}

export async function initPersistence(seedPayload: unknown) {
  const currentPool = getPool();
  if (!currentPool) {
    return seedPayload;
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
    return;
  }

  await currentPool.query(
    "INSERT INTO app_state (id, payload, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()",
    [STATE_ROW_ID, JSON.stringify(payload)],
  );
}
