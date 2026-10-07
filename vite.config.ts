import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { fileURLToPath } from "node:url";
import { createApiHandler, type ApiRoute } from "./server/api";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

function localApi(env: Record<string, string | undefined>): Plugin {
  return {
    name: "problem2app-local-api",
    configureServer(server) {
      const routes = new Map<ApiRoute, ReturnType<typeof createApiHandler>>();
      for (const route of ["contact", "capabilities", "invoice"] as const) {
        routes.set(
          route,
          createApiHandler(route, {
            local: true,
            env,
            storageDirectory: fileURLToPath(
              new URL("./.local", import.meta.url)
            ),
          })
        );
      }
      server.middlewares.use((req, res, next) => {
        const route = new URL(
          req.url || "/",
          "http://localhost"
        ).pathname.replace(/^\/api\//, "") as ApiRoute;
        const handler = req.url?.startsWith("/api/")
          ? routes.get(route)
          : undefined;
        if (handler) void handler(req, res);
        else next();
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    localApi({ ...loadEnv(mode, projectRoot, ""), ...process.env }),
  ],
  envDir: projectRoot,
  root: fileURLToPath(new URL("./client", import.meta.url)),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./client/src", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL("./dist/public", import.meta.url)),
    emptyOutDir: true,
  },
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
}));
