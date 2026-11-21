import express from "express";
import { cors } from "./middleware/cors.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { notFound } from "./middleware/notFound.middleware.js";
import { authRoutes } from "./routes/auth.routes.js";
import routes from "./routes/index.js";

/** Build the Express app. Kept separate from server.js so tests can use it without opening a port. */
export function createApp() {
  const app = express();

  app.use(cors);
  // Better Auth parses its own request bodies, so it goes before express.json().
  app.all("/api/auth/{*path}", authRoutes);
  app.use(express.json({ limit: "100kb" }));
  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
