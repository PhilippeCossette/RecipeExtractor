import { useAppForm } from "@/hooks/useAppForm";
import { authClient } from "@/lib/authClient";
import { SignInSchema, type SignInValues } from "@/validators/auth.validator";

const defaultValues: SignInValues = { email: "", password: "" };

/** Email + password sign-in. Calls onSuccess once Better Auth has set the session cookie. */
export function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useAppForm({
    defaultValues,
    validators: {
      onBlur: SignInSchema,
      onSubmit: SignInSchema,
      // Runs after the zod check passes. A returned string becomes the form's error.
      onSubmitAsync: async ({ value }) => {
        const { error } = await authClient.signIn.email(value);
        return error ? (error.message ?? "Couldn't sign in, try again.") : undefined;
      },
    },
    onSubmit: () => onSuccess(),
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField name="email">
        {(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => <field.TextField label="Password" type="password" autoComplete="current-password" />}
      </form.AppField>
      <form.AppForm>
        <form.FormError />
        <form.SubmitButton label="Sign in" className="w-full" />
      </form.AppForm>
    </form>
  );
}
