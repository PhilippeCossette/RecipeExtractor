import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";
import { clearSession, getSession } from "@/lib/sessionQuery";

export const Route = createFileRoute("/auth")({
  ssr: false, // the session cookie is checked in the browser
  beforeLoad: async ({ context }) => {
    if (await getSession(context.queryClient)) throw redirect({ to: "/home" }); // already signed in
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <AuthForm
        onSuccess={() => {
          clearSession(queryClient);
          navigate({ to: "/home" });
        }}
      />
    </main>
  );
}
