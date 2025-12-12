import { FindingLevel, FindingType } from "@/utils/enums";
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
    message: "Name is required when github_repo_id is not provided",
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

export const createAnalysisThreadSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  name: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  description: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  is_public: z.boolean(),
});

export type CreateAnalysisThreadFormValues = z.infer<typeof createAnalysisThreadSchema>;

export const createAnalysisVersionSchema = z
  .object({
    analysis_thread_id: z.string().min(1, "Analysis ID is required"),
    scopes: z.array(z.string()),
    scope_strategy: z.enum(["all", "explicit", "parent"]),
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

export const uploadCodeFileSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
  parent_id: z.string().optional(),
});

export type UploadCodeFileFormValues = z.infer<typeof uploadCodeFileSchema>;

export const pasteCodeFileSchema = z.object({
  content: z.string().min(1, "Please enter contract code"),
  parent_id: z.string().optional(),
});

export type PasteCodeFileFormValues = z.infer<typeof pasteCodeFileSchema>;

export const scanCodeAddressSchema = z.object({
  address: z
    .string()
    .min(1, "Please enter a contract address")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid address"),
  parent_id: z.string().optional(),
});

export type ScanCodeAddressFormValues = z.infer<typeof scanCodeAddressSchema>;

export const uploadCodeFolderSchema = z.object({
  fileMap: z
    .record(z.string(), z.instanceof(File))
    .refine(
      (fileMap) => Object.keys(fileMap).length > 0,
      "Please upload a folder with contract files",
    ),
  parent_id: z.string().optional(),
});

export type UploadCodeFolderFormValues = z.infer<typeof uploadCodeFolderSchema>;

export const analysisFindingBodySchema = z.object({
  type: z.nativeEnum(FindingType),
  level: z.nativeEnum(FindingLevel),
  name: z.string().min(1, "Name is required"),
  explanation: z.string().min(1, "Explanation is required"),
  recommendation: z.string().min(1, "Recommendation is required"),
  reference: z.string().min(1, "Reference is required"),
});

export type AnalysisFindingBody = z.infer<typeof analysisFindingBodySchema>;

export const addAnalysisFindingBodySchema = analysisFindingBodySchema.extend({
  scope_id: z.string().min(1, "Scope ID must be a valid identifier"),
});

export type AddAnalysisFindingBody = z.infer<typeof addAnalysisFindingBodySchema>;

export const updateAnalysisNodeBodySchema = z.object({
  findings_remove: z.array(z.string()).default([]),
  findings_add: z.array(analysisFindingBodySchema).default([]),
});

export type UpdateAnalysisNodeBody = z.infer<typeof updateAnalysisNodeBodySchema>;

export const findingFeedbackSchema = z.object({
  feedback: z.string().optional(),
  is_verified: z.boolean().optional(),
});

export type FindingFeedbackBody = z.infer<typeof findingFeedbackSchema>;
