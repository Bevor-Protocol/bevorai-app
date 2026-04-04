import {
  FindingLevelEnum,
  FindingStatusEnum,
  FindingTypeEnum,
} from "@/types/api/responses/security";
import { z } from "zod";

export const teamFormSchema = z.object({
  name: z.string().min(4, "team name must be at least 4 characters"),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

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
  .refine((data) => !data.github_repo_id || (!data.name && !data.description), {
    message: "Name and description cannot be provided when github_repo_id is provided",
    path: ["github_repo_id"],
  });
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const createAnalysisSchema = z
  .object({
    project_id: z.string().min(1, "project_id is required"),
    scopes: z.array(z.string()),
    scope_strategy: z.enum(["all", "explicit", "parent"]),
    parent_version_id: z.string().optional(),
    code_version_id: z.string().optional(),
  })
  .refine(
    (data) => data.parent_version_id || data.code_version_id,
    "Either parent_version_id or code_version_id must be provided",
  );

export type createAnalysisFormValues = z.infer<typeof createAnalysisSchema>;

export const baseCodeUploadSchema = z.object({
  parent_code_version_id: z.string().optional(),
  is_private: z.boolean().optional(),
  parent_analysis_id: z.string().optional(),
  analyze: z.boolean().optional(),
});

export type BaseCodeUploadValues = z.infer<typeof baseCodeUploadSchema>;

export const uploadCodeFileSchema = z.object({
  ...baseCodeUploadSchema.shape,
  file: z.instanceof(File, { message: "File is required" }),
});

export type UploadCodeFileFormValues = z.infer<typeof uploadCodeFileSchema>;

export const pasteCodeFileSchema = z.object({
  ...baseCodeUploadSchema.shape,
  content: z.string().min(1, "Please enter contract code"),
});

export type PasteCodeFileFormValues = z.infer<typeof pasteCodeFileSchema>;

export const scanCodeAddressSchema = z.object({
  ...baseCodeUploadSchema.shape,
  address: z
    .string()
    .min(1, "Please enter a contract address")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Please enter a valid address"),
});

export type ScanCodeAddressFormValues = z.infer<typeof scanCodeAddressSchema>;

export const uploadCodeFolderSchema = z.object({
  ...baseCodeUploadSchema.shape,
  zip: z.instanceof(Blob, { message: "Zip file is required" }),
});

export type UploadCodeFolderFormValues = z.infer<typeof uploadCodeFolderSchema>;

export const createCodeFromGithubSchema = z.object({
  ...baseCodeUploadSchema.shape,
  branch: z.string().optional(),
  commit: z.string().optional(),
});

export type CreateCodeFromGithubFormValues = z.infer<typeof createCodeFromGithubSchema>;

export const createCodeFromPublicGithubSchema = z.object({
  ...baseCodeUploadSchema.shape,
  url: z.string(),
});

export type CreateCodeFromPublicGithubFormValues = z.infer<typeof createCodeFromPublicGithubSchema>;

export const analysisFindingBodySchema = z.object({
  type: z.enum(FindingTypeEnum),
  level: z.enum(FindingLevelEnum),
  name: z.string().min(1, "Name is required"),
  explanation: z.string().min(1, "Explanation is required"),
  recommendation: z.string().min(1, "Recommendation is required").optional(),
  reference: z.string().min(1, "Reference is required").optional(),
});

export type AnalysisFindingBody = z.infer<typeof analysisFindingBodySchema>;

export const addAnalysisFindingBodySchema = analysisFindingBodySchema.extend({
  location_id: z.string().min(1, "Node ID must be a valid identifier"),
  scope_ids: z.array(z.string()).min(1, "at least 1 scope must be used"),
});

export type AddAnalysisFindingBody = z.infer<typeof addAnalysisFindingBodySchema>;

export const findingUpdateBody = z.object({
  feedback: z.string().optional(),
  status: z.enum(FindingStatusEnum).optional(),
});

export type FindingUpdateBody = z.infer<typeof findingUpdateBody>;

export const findingFeedbackBodySchema = z.object({
  feedback: z.string().optional(),
  is_verified: z.boolean(),
});

export type FindingFeedbackBody = z.infer<typeof findingFeedbackBodySchema>;
