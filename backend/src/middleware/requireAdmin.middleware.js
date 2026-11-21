/** Only let admins through. Put it after requireAuth, which sets req.user. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }
  next();
}
