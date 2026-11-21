import { createFormHook } from "@tanstack/react-form";
import { FormError } from "@/components/form/FormError";
import { SelectField } from "@/components/form/SelectField";
import { SubmitButton } from "@/components/form/SubmitButton";
import { TextField } from "@/components/form/TextField";
import { fieldContext, formContext } from "@/components/form/formContext";

/**
 * The app's TanStack Form hook. Every form uses it, so they all share the same shadcn fields:
 *
 *   const form = useAppForm({ defaultValues, validators: { onSubmit: zodSchema }, onSubmit })
 *   <form.AppField name="email">{(field) => <field.TextField label="Email" type="email" />}</form.AppField>
 *   <form.AppForm><form.FormError /><form.SubmitButton label="Save" /></form.AppForm>
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, SelectField },
  formComponents: { SubmitButton, FormError },
});
