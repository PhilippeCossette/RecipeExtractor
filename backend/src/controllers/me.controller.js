/** GET /me: the signed-in user (requireAuth runs first). */
export function meController(req, res) {
  const { id, name, email, emailVerified, image, createdAt } = req.user;
  res.json({ user: { id, name, email, emailVerified, image, createdAt }, sessionExpiresAt: req.session.expiresAt });
}
