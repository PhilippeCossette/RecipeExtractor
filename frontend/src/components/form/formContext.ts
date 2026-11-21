import { createFormHookContexts } from "@tanstack/react-form";

/** React contexts shared by every TanStack Form in the app (see hooks/useAppForm.ts). */
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
