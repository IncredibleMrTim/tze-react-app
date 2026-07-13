import Pusher from "pusher";

// Singleton pattern to reuse Pusher instance
let pusherInstance: Pusher | null = null;

/**
 * Get Pusher server instance for broadcasting events
 * Used in Server Actions to notify all connected clients
 */
export function getPusherServer(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }

  return pusherInstance;
}

/**
 * Broadcast event to all connected clients
 * @param channel - Channel name (e.g., "jobs", "inventory")
 * @param event - Event name (e.g., "job:created", "inventory:updated")
 * @param data - Data to send to clients
 */
export async function broadcastEvent(
  channel: string,
  event: string,
  data: unknown
): Promise<void> {
  const pusher = getPusherServer();

  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error("Failed to broadcast event:", { channel, event, error });
    // Don't throw - broadcasting is nice-to-have, not critical
  }
}
