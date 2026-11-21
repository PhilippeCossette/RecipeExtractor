import { config } from "../config/index.js";

/**
 * Let your web/mobile app call the API.
 * - Origins in APP_ORIGINS (your frontends) get credentials, so the login cookie is sent.
 * - Any other origin gets CORS_ORIGIN (default "*"), without cookies.
 * Native mobile apps don't use CORS, so this only matters for browsers.
 */
export function cors(req, res, next) {
  const origin = req.get("Origin");
  if (origin && config.appOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
  } else {
    res.set("Access-Control-Allow-Origin", config.corsOrigin);
  }
  res.vary("Origin");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
}
