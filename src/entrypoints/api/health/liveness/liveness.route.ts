import { Elysia } from "elysia";
import { livenessSchema } from "./liveness.schema";

export function livenessRoute() {
  return new Elysia().get("/health/liveness", () => ({ status: "ok" }) as const, livenessSchema);
}
