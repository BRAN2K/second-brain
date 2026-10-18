import { t } from "elysia";

export const readinessResponseSchema = t.Object(
  {
    status: t.Literal("ready"),
  },
  { description: "Service and its dependencies are up" },
);

export const readinessUnreadyResponseSchema = t.Object(
  {
    status: t.Literal("unready"),
  },
  { description: "Service or one of its dependencies is down" },
);

export const readinessSchema = {
  response: {
    200: readinessResponseSchema,
    503: readinessUnreadyResponseSchema,
  },
  detail: {
    hide: true,
    tags: ["Health"],
    description: "Readiness check endpoint",
    summary: "Checks if the service and its dependencies are up",
  },
};
