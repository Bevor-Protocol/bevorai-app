import { FindingLevel, FindingType } from "@/utils/enums";
import { z } from "zod";

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

export const analysisFindingBodySchema = z.object({
  type: z.enum(FindingType),
  level: z.enum(FindingLevel),
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
