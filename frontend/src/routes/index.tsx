import { createFileRoute, redirect } from "@tanstack/react-router";

// "/" goes to /home; the _authed layout sends signed-out visitors on to /auth.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/home" });
  },
});
