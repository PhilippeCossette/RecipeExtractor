import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessages } from "@/utils";
import { useFieldContext } from "./formContext";

type Props = { label: string; hideLabel?: boolean; hint?: string } & Omit<
  ComponentProps<typeof Input>,
  "id" | "name" | "value" | "onChange" | "onBlur"
>;

/** shadcn Label + Input wired to a TanStack Form field, with its errors underneath. Use as <field.TextField />. */
export function TextField({ label, hideLabel, hint, className, ...inputProps }: Props) {
  const field = useFieldContext<string>();
  const errors = field.state.meta.isTouched ? errorMessages(field.state.meta.errors) : [];
  const id = `field-${field.name}`;

  return (
    <div className={className ?? "flex flex-col gap-2"}>
      <Label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
      <Input
        id={id}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length ? `${id}-error` : undefined}
        {...inputProps}
      />
      {hint && !errors.length ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {errors.length ? (
        <p id={`${id}-error`} className="text-destructive text-xs">
          {errors.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
