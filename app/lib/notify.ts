import { Pool } from "pg";
import { waitUntil } from "@vercel/functions";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Fire-and-forget: pg_notify is a broadcast for the websocket layer that no
// caller reads the result of, so it must never block a mutation's response.
// waitUntil keeps the invocation alive long enough for the query to finish
// even after the response is sent, instead of a bare unawaited promise that
// could get cut off mid-flight.
export function notify(channel: string, payload: unknown): void {
  waitUntil(
    pool.query("SELECT pg_notify($1, $2)", [channel, JSON.stringify(payload)])
      .catch((err) => {
        console.error(`notify(${channel}) failed:`, err);
      }),
  );
}
