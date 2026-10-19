import type { Plugin } from "vite";

export function apiMiddlewarePlugin(): Plugin {
  return {
    name: "vite-plugin-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || "";
        if (!reqUrl.startsWith("/api/")) {
          return next();
        }

        try {
          const host = req.headers.host || "localhost:6060";
          const url = new URL(reqUrl, `http://${host}`);
          const method = req.method || "GET";

          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (v) {
              headers.set(k, Array.isArray(v) ? v.join(", ") : v);
            }
          }

          let bodyText: string | undefined;
          if (method !== "GET" && method !== "HEAD") {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            bodyText = Buffer.concat(chunks).toString("utf-8");
          }

          const apiModule = await server.ssrLoadModule("/src/server/api.ts");
          const response: Response = await apiModule.handleApiRequest(
            url,
            method,
            headers,
            bodyText
          );

          res.statusCode = response.status;
          response.headers.forEach((val, key) => {
            res.setHeader(key, val);
          });

          const text = await response.text();
          res.end(text);
        } catch (err: any) {
          console.error("Vite API middleware error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: { message: err.message || "Internal server error" } }));
        }
      });
    },
  };
}
