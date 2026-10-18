import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import logo from "./assets/logo.svg" with { type: "text" };
import scalarBundle from "./assets/scalar.standalone.min.js.txt" with { type: "text" };

export function docsRoutes() {
  const app = new Elysia();

  const documentation = {
    info: { title: "Second Brain Extraction API", version: "0.1.0" },
    tags: [
      { name: "Templates", description: "Manage extraction templates" },
      { name: "Extractions", description: "Run LLM extractions" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http" as const,
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };

  app.get(
    "docs/scalar.js",
    () =>
      new Response(scalarBundle, {
        headers: {
          "content-type": "application/javascript",
          "cache-control": "public, max-age=31536000, immutable",
        },
      }),
    { detail: { hide: true } },
  );

  app.get(
    "docs/favicon.svg",
    () =>
      new Response(logo, {
        headers: {
          "content-type": "image/svg+xml",
          "cache-control": "public, max-age=31536000, immutable",
        },
      }),
    { detail: { hide: true } },
  );

  app.get("/", ({ redirect }) => redirect("/docs"), {
    detail: { hide: true },
  });

  app.use(
    openapi({
      documentation: documentation,
      path: "/docs",
      scalar: {
        cdn: "docs/scalar.js",
        favicon: "docs/favicon.svg",
      },
    }),
  );

  return app;
}
