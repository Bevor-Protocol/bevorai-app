import { z } from "zod";

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
