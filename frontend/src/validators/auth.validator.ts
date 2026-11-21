import { z } from "zod";

// Same rules as the API (Better Auth's minPasswordLength is 8).

export const SignInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const SignUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100, "Name is too long"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters").max(128, "At most 128 characters"),
});

export type SignInValues = z.infer<typeof SignInSchema>;
export type SignUpValues = z.infer<typeof SignUpSchema>;
