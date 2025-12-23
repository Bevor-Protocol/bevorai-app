import { MemberRoleEnum } from "@/utils/enums";
import z from "zod";

export const inviteItemSchema = z.object({
  identifier: z.string().trim().min(1), // email or wallet address,
  role: z.enum(MemberRoleEnum),
});

export type InviteItemValues = z.infer<typeof inviteItemSchema>;

export const inviteFormSchema = z
  .object({
    members: z.array(inviteItemSchema),
  })
  .transform((a) => {
    return {
      members: a.members
        .map((item) => inviteItemSchema.safeParse(item))
        .filter((item) => item.success)
        .map((item) => item.data),
    };
  });
export type InviteFormValues = z.infer<typeof inviteFormSchema>;

export const updateMemberSchema = z.object({
  role: z.enum(MemberRoleEnum),
});

export type UpdateMemberValues = z.infer<typeof updateMemberSchema>;
