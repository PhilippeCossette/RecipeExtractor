import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFieldContext } from "./formContext";

type Props = {
  label: string;
  hideLabel?: boolean;
  options: readonly { value: string; label: string }[];
  className?: string;
};

/** shadcn Select wired to a TanStack Form field. Use as <field.SelectField />. */
export function SelectField({ label, hideLabel, options, className }: Props) {
  const field = useFieldContext<string>();
  const id = `field-${field.name}`;

  return (
    <div className={className ?? "flex flex-col gap-2"}>
      <Label htmlFor={id} className={hideLabel ? "sr-only" : undefined}>
        {label}
      </Label>
      <Select value={field.state.value} onValueChange={(value) => field.handleChange(value)}>
        <SelectTrigger id={id} onBlur={field.handleBlur} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
