import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/authClient";
import { clearSession } from "@/lib/sessionQuery";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
});

/** The signed-in user's account, and sign out. */
function ProfilePage() {
  const { session, queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const { user } = session;

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    clearSession(queryClient);
    queryClient.clear(); // drop this user's cached recipes
    navigate({ to: "/auth" });
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Member since {new Date(user.createdAt).toLocaleDateString()}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={signOut} disabled={signingOut}>
          {signingOut ? "Signing out..." : "Sign out"}
        </Button>
      </CardFooter>
    </Card>
  );
}
