"use client";

import { teamActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberRoleEnum } from "@/utils/enums";
import { inviteFormSchema, InviteFormValues, InviteItemValues } from "@/utils/schema/invite";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const InviteForm: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const queryClient = useQueryClient();

  const [invitees, setInvitees] = useState<InviteItemValues[]>([
    {
      identifier: "",
      role: MemberRoleEnum.MEMBER,
    },
  ]);

  const inviteMembersMutation = useMutation({
    mutationFn: async (data: InviteFormValues) =>
      teamActions.inviteMembers(teamSlug, data).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      setInvitees([{ identifier: "", role: MemberRoleEnum.MEMBER }]);
      toast.success("Invitations sent successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send invitations");
    },
  });

  const addInvitee = (): void => {
    setInvitees([...invitees, { identifier: "", role: MemberRoleEnum.MEMBER }]);
  };

  const removeInvitee = (index: number): void => {
    if (invitees.length > 1) {
      setInvitees(invitees.filter((_, i) => i !== index));
    }
  };

  const updateInvitee = (index: number, field: keyof InviteItemValues, value: string): void => {
    setInvitees(
      invitees.map((invitee, i) => (i === index ? { ...invitee, [field]: value } : invitee)),
    );
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    const parsed = inviteFormSchema.safeParse({ members: invitees });

    if (!parsed.success || (parsed.success && !parsed.data.members.length)) {
      return;
    }
    inviteMembersMutation.mutate(parsed.data);
  };

  const isValid = invitees.some((invitee) => invitee.identifier.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {invitees.map((invitee, index) => (
          <div key={index} className="flex items-center gap-3">
            <Input
              type="text"
              className="flex-1"
              value={invitee.identifier}
              onChange={(e) => updateInvitee(index, "identifier", e.target.value)}
              disabled={inviteMembersMutation.isPending}
              placeholder="Enter email address or wallet address"
            />
            <Select
              value={invitee.role}
              disabled={inviteMembersMutation.isPending}
              onValueChange={(value) => updateInvitee(index, "role", value as MemberRoleEnum)}
            >
              <SelectTrigger className="min-w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={MemberRoleEnum.MEMBER}>Member</SelectItem>
                  <SelectItem value={MemberRoleEnum.OWNER}>Owner</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {invitees.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeInvitee(index)}
                disabled={inviteMembersMutation.isPending}
                className="shrink-0"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={addInvitee}
          disabled={inviteMembersMutation.isPending}
        >
          <Plus className="size-4 mr-2" />
          Add Another Person
        </Button>
        <Button type="submit" disabled={inviteMembersMutation.isPending || !isValid}>
          {inviteMembersMutation.isPending ? "Inviting..." : "Invite"}
        </Button>
      </div>
    </form>
  );
};

export default InviteForm;
