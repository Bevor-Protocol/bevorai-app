import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((value) => {
      if (!value || value.trim() === "") return [];
      return value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    })
    .pipe(z.array(z.string())),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((value) => {
      if (!value || value.trim() === "") return [];
      return value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    })
    .pipe(z.array(z.string())),
});
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const createAnalysisVersionSchema = z
  .object({
    analysis_id: z.string().min(1, "Analysis ID is required"),
    scopes: z.array(z.string()),
    retain_scope: z.boolean(),
    parent_version_id: z.string().optional(),
    code_version_id: z.string().optional(),
  })
  .refine(
    (data) => data.parent_version_id || data.code_version_id,
    "Either parent_version_id or code_version_id must be provided",
  );

export type CreateAnalysisVersionFormValues = z.infer<typeof createAnalysisVersionSchema>;

export const createChatSchema = z.object({
  code_version_id: z.string().optional(),
  analysis_node_id: z.string().optional(),
  chat_type: z.enum(["code", "analysis"]),
});

export type CreateChatFormValues = z.infer<typeof createChatSchema>;
