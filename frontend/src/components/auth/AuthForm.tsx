import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

type Mode = "signin" | "signup";

/** The /auth card: sign in, with a button to switch to sign up (and back). */
export function AuthForm({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const isSignUp = mode === "signup";

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{isSignUp ? "Create an account" : "Sign in"}</CardTitle>
        <CardDescription>{isSignUp ? "Save the recipes you extract." : "Welcome back."}</CardDescription>
      </CardHeader>
      <CardContent>
        {isSignUp ? <SignUpForm onSuccess={onSuccess} /> : <SignInForm onSuccess={onSuccess} />}
      </CardContent>
      <CardFooter className="justify-center">
        <Button type="button" variant="link" onClick={() => setMode(isSignUp ? "signin" : "signup")}>
          {isSignUp ? "Already have an account? Sign in" : "No account yet? Sign up"}
        </Button>
      </CardFooter>
    </Card>
  );
}
