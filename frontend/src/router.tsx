import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  // A fresh QueryClient per request, as the TanStack docs recommend for SSR.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
  });

  // Wraps the app in a QueryClientProvider.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}
