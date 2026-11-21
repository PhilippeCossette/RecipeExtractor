/** GET /health */
export function healthController(req, res) {
  res.json({ ok: true, uptimeSeconds: Math.round(process.uptime()) });
}
