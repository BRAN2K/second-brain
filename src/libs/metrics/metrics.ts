import { Registry } from "prom-client";

export function createMetrics() {
  return { registry: new Registry() };
}

export type Metrics = ReturnType<typeof createMetrics>;
