import { z } from "zod";

export const teamFormSchema = z.object({
  name: z.string().min(4, "team name must be at least 4 characters"),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;
