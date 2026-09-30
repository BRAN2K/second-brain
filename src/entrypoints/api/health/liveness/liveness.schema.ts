import { t } from "elysia";

export const livenessResponseSchema = t.Object(
  {
    status: t.Literal("ok"),
  },
  { description: "Service is up" },
);

export const livenessSchema = {
  response: {
    200: livenessResponseSchema,
  },
  detail: {
    hide: true,
    tags: ["Health"],
    description: "Liveness check endpoint",
    summary: "Checks if the service is up",
  },
};
