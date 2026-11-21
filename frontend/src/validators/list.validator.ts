import { z } from "zod";

// Same rules as the API (validators/list.validator.js).
export const ListFormSchema = z.object({
  name: z.string().trim().min(1, "Give the list a name").max(50, "At most 50 characters"),
  description: z.string().trim().max(300, "At most 300 characters"),
});

export type ListFormValues = z.infer<typeof ListFormSchema>;
