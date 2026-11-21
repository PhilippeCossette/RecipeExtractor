import { useAppForm } from "@/hooks/useAppForm";
import { authClient } from "@/lib/authClient";
import { SignUpSchema, type SignUpValues } from "@/validators/auth.validator";

const defaultValues: SignUpValues = { name: "", email: "", password: "" };

/** Create an account. Calls onSuccess once Better Auth has set the session cookie. */
export function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useAppForm({
    defaultValues,
    validators: {
      onBlur: SignUpSchema,
      onSubmit: SignUpSchema,
      // Runs after the zod check passes. A returned string becomes the form's error.
      onSubmitAsync: async ({ value }) => {
        const { error } = await authClient.signUp.email({ ...value, name: value.name.trim() });
        return error ? (error.message ?? "Couldn't create the account, try again.") : undefined;
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
      <form.AppField name="name">
        {(field) => <field.TextField label="Name" autoComplete="name" />}
      </form.AppField>
      <form.AppField name="email">
        {(field) => <field.TextField label="Email" type="email" autoComplete="email" />}
      </form.AppField>
      <form.AppField name="password">
        {(field) => (
          <field.TextField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." />
        )}
      </form.AppField>
      <form.AppForm>
        <form.FormError />
        <form.SubmitButton label="Create account" className="w-full" />
      </form.AppForm>
    </form>
  );
}
