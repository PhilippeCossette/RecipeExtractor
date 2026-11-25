import { Outlet, createFileRoute, redirect, useLocation } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { AppNav } from "@/components/AppNav";
import { getSession } from "@/lib/sessionQuery";

/** Layout for signed-in pages ("_" adds no URL segment). Signed-out visitors go to /auth. */
export const Route = createFileRoute("/_authed")({
  ssr: false, // the session cookie is checked in the browser
  beforeLoad: async ({ context }) => {
    const session = await getSession(context.queryClient);
    if (!session) throw redirect({ to: "/auth" });
    return { session }; // child pages read it with Route.useRouteContext()
  },
  component: AuthedLayout,
});

/** Page transition settings: tweak these to change the feel. */
const PAGE_TRANSITION = {
  /** How far (px) the new page slides up from. */
  offsetY: 12,
  /** Length of the fade/slide in seconds. */
  duration: 0.25,
};

function AuthedLayout() {
  // Only the path, so changing ?search params doesn't replay the animation.
  const pathname = useLocation({ select: (location) => location.pathname });
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-svh">
      <AppNav />
      <main className="container-page pt-6 pb-28 sm:pt-10">
        {/* The key changes on every page, so the new page fades and slides in. */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: reduceMotion ? 0 : PAGE_TRANSITION.offsetY }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: PAGE_TRANSITION.duration, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
