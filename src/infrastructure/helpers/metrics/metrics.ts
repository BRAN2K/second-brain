import { Registry } from "prom-client";

// TODO: register actual application metrics
export function createMetrics() {
  return { registry: new Registry() };
}

export type Metrics = ReturnType<typeof createMetrics>;
