export const routeConfig = {
  body: "extraction.create.request",
  response: {
    201: "extraction.create.response",
    400: "error",
    404: "error",
    422: "error",
    500: "error",
  },
  detail: {
    summary: "Create an extraction",
    description: "Extracts structured data from text or an audio file using a template.",
    tags: ["Extractions"] as string[],
  },
} as const;
