import z from "zod";

export const keyFormSchema = z.object({
  name: z.string().min(1),
  scopes: z.object({
    project: z.literal(["read", "write"]),
    code: z.literal(["read", "write"]),
    analysis: z.literal(["read", "write"]),
    chat: z.literal(["read", "write"]),
    user: z.literal("read"),
  }),
});
export type KeyFormValues = z.infer<typeof keyFormSchema>;
