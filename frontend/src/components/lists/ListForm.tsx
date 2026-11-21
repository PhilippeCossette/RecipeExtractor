import { useAppForm } from "@/hooks/useAppForm";
import { ListFormSchema, type ListFormValues } from "@/validators/list.validator";

type Props = {
  initial?: Partial<ListFormValues>;
  submitLabel: string;
  /** Save the list. Throw to show the error in the form (e.g. "You already have a list called Quick"). */
  onSave: (values: { name: string; description: string | null }) => Promise<unknown>;
  /** After a successful save. */
  onDone?: () => void;
  compact?: boolean; // name only (no description), for the "new list" box in the add-to-list popup
};

/** Create or edit a list: name (+ description). TanStack Form + zod; API errors show as the form error. */
export function ListForm({ initial, submitLabel, onSave, onDone, compact }: Props) {
  const form = useAppForm({
    defaultValues: { name: initial?.name ?? "", description: initial?.description ?? "" },
    validators: {
      onSubmit: ListFormSchema,
      onSubmitAsync: async ({ value }) => {
        try {
          await onSave({ name: value.name.trim(), description: value.description.trim() || null });
          return undefined;
        } catch (err) {
          return err instanceof Error ? err.message : "Couldn't save the list.";
        }
      },
    },
    onSubmit: ({ formApi }) => {
      if (!initial) formApi.reset(); // ready for the next new list
      onDone?.();
    },
  });

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation(); // the form can sit inside a dialog
        form.handleSubmit();
      }}
    >
      <div className={compact ? "flex items-start gap-2" : "flex flex-col gap-3"}>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label="List name"
              hideLabel={compact}
              placeholder="e.g. Asian, Quick, Desserts"
              autoComplete="off"
              className={compact ? "flex flex-1 flex-col gap-1" : undefined}
            />
          )}
        </form.AppField>
        {compact ? null : (
          <form.AppField name="description">
            {(field) => <field.TextField label="Description (optional)" autoComplete="off" />}
          </form.AppField>
        )}
        <form.AppForm>
          <form.SubmitButton label={submitLabel} pendingLabel="Saving..." className={compact ? undefined : "self-start"} />
        </form.AppForm>
      </div>
      <form.AppForm>
        <form.FormError />
      </form.AppForm>
    </form>
  );
}
