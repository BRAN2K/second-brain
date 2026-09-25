export const routeConfig = {
  body: "template.create.request",
  response: {
    201: "template.create.response",
    400: "error",
    422: "error",
    500: "error",
  },
  detail: {
    summary: "Create a template",
    description: "Creates an extraction template with its field definitions.",
    tags: ["Templates"] as string[],
  },
} as const;
