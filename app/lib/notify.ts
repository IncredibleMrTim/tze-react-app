import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function notify(channel: string, payload: unknown) {
  await pool.query("SELECT pg_notify($1, $2)", [
    channel,
    JSON.stringify(payload),
  ]);
}
