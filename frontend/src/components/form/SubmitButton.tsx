import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "./formContext";

type Props = { label: string; pendingLabel?: string; pending?: boolean } & Omit<ComponentProps<typeof Button>, "type">;

/** Submit button that disables itself while the form submits. Use inside <form.AppForm> as <form.SubmitButton />. */
export function SubmitButton({ label, pendingLabel = "Please wait...", pending = false, disabled, ...props }: Props) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={disabled || pending || isSubmitting} {...props}>
          {pending || isSubmitting ? pendingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
