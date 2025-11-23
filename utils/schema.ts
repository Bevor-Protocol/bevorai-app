import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z
    .string()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  tags: z.string().optional(), // api response is an array. but easier to work with a string in a form.
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

export const uploadCodeFileSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
  parent_id: z.string().optional(),
});

export type UploadCodeFileFormValues = z.infer<typeof uploadCodeFileSchema>;

export const pasteCodeFileSchema = z.object({
  code: z.string().min(1, "Please enter contract code"),
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
