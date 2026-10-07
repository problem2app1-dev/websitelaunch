import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createApiHandler } from "./api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  const local =
    process.env.LOCAL_CONTACT_STORAGE === "true" &&
    process.env.NODE_ENV !== "production" &&
    process.env.VERCEL !== "1";
  for (const route of ["contact", "capabilities", "invoice"] as const) {
    app.all(`/api/${route}`, createApiHandler(route, { local }));
  }
  app.use("/api", (_req, res) => {
    res
      .status(404)
      .json({ ok: false, message: "This API route does not exist." });
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
