import { Client } from "pg";
import { experimental_upgradeWebSocket } from "@vercel/functions";

let listener: Client | null = null;
const sockets = new Set<(payload: string) => void>();

async function ensureListener() {
  if (listener) return;
  listener = new Client({ connectionString: process.env.DATABASE_URL });
  await listener.connect();
  await listener.query("LISTEN job_updates");
  listener.on("notification", (msg) => {
    sockets.forEach((send) => send(msg.payload ?? ""));
  });
}

export async function GET() {
  await ensureListener();
  return experimental_upgradeWebSocket((ws) => {
    const send = (payload: string) => ws.send(payload);
    sockets.add(send);
    ws.on("close", () => sockets.delete(send));
  });
}
