import { z } from "zod";

export const projectFormSchema = z
  .object({
    name: z.string().optional(),
    description: z
      .string()
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
    tags: z.string().optional(), // api response is an array. but easier to work with a string in a form.
    github_repo_id: z.number().optional(),
  })
  .refine((data) => data.name || data.github_repo_id, {
    message: "Name is required",
    path: ["name"],
  })
  .refine((data) => !data.name || data.name.length > 0, {
    message: "Name cannot be empty",
    path: ["name"],
  })
  .refine((data) => !data.github_repo_id || (!data.name && !data.description), {
    message: "Name and description cannot be provided when github_repo_id is provided",
    path: ["github_repo_id"],
  });
export type ProjectFormValues = z.infer<typeof projectFormSchema>;
