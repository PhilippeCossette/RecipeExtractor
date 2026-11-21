import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { isAdmin } from "@/lib/authClient";
import { getSession } from "@/lib/sessionQuery";

/**
 * Layout for every page that needs a signed-in user (/home, /dashboard, /profile, /recipes/:id).
 * The "_" prefix means it adds no segment to the URL. Signed-out visitors go to /auth.
 */
export const Route = createFileRoute("/_authed")({
  ssr: false, // the session cookie is checked in the browser
  beforeLoad: async ({ context }) => {
    const session = await getSession(context.queryClient);
    if (!session) throw redirect({ to: "/auth" });
    return { session }; // child pages read it with Route.useRouteContext()
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { session } = Route.useRouteContext();
  return (
    <div className="min-h-svh">
      <AppNav showAdmin={isAdmin(session)} />
      <main className="mx-auto w-full max-w-3xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
