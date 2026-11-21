import { errorMessages } from "@/utils";
import { useFormContext } from "./formContext";

/**
 * Form-level errors, e.g. what the API answered ("Invalid email or password").
 * Field errors show under each field instead. Use inside <form.AppForm> as <form.FormError />.
 */
export function FormError() {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
      {(error) => {
        const messages = errorMessages(typeof error === "string" ? [error] : []);
        return messages.length ? (
          <p role="alert" className="text-destructive text-sm">
            {messages.join(", ")}
          </p>
        ) : null;
      }}
    </form.Subscribe>
  );
}
