/**
 * Turn TanStack Form errors into display strings. Errors are zod issues ({ message }) from the schemas,
 * or plain strings from our own validators (e.g. the API's "Invalid email or password").
 */
export function errorMessages(errors: readonly unknown[]): string[] {
  const messages = errors
    .map((error) => (typeof error === "string" ? error : (error as { message?: string } | null)?.message))
    .filter((message): message is string => Boolean(message));
  return [...new Set(messages)];
}
