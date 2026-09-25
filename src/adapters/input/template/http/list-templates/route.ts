export const routeConfig = {
  query: "template.list.request",
  response: {
    200: "template.list.response",
    400: "error",
    500: "error",
  },
  detail: {
    summary: "List templates",
    description: "Lists extraction templates with cursor-based pagination.",
    tags: ["Templates"] as string[],
  },
} as const;
