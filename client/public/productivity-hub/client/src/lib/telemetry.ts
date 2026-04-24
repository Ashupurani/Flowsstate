import { apiRequest } from "@/lib/queryClient";

export async function trackEvent(name: string, payload: Record<string, unknown> = {}) {
  try {
    await apiRequest("/api/telemetry/events", {
      method: "POST",
      body: JSON.stringify({ name, payload }),
    });
  } catch (error) {
    // Telemetry failures must never block product flows.
    console.error("Telemetry event failed:", error);
  }
}
