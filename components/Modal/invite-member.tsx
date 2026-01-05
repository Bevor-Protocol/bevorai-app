"use client";

import { teamActions } from "@/actions/bevor";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Plus, Trash2, Users } from "lucide-react";
import React, { useRef, useState } from "react";

const InviteMemberModal: React.FC<{ teamSlug: string }> = ({ teamSlug }) => {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

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
    },
  });

  const addInvitee = (): void => {
    setInvitees([...invitees, { identifier: "", role: MemberRoleEnum.MEMBER }]);
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
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
    <div>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <Users className="size-5 text-blue-400" />
          <DialogTitle>Invite Team Member(s)</DialogTitle>
        </div>
        <DialogDescription>Send invitations to collaborate on this team</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Team Members</FieldLabel>
            <ScrollArea
              className="space-y-3 h-[calc(44px*5)]"
              viewportRef={scrollRef as React.RefObject<HTMLDivElement>}
              type="auto"
            >
              {invitees.map((invitee, index) => (
                <div key={index} className="flex items-center gap-3 py-1 pr-4 pl-1">
                  <Input
                    id={`identifier-${index}`}
                    name={`identifier-${index}`}
                    type="text"
                    className="grow"
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
                    <SelectTrigger id={`role-${index}`} className="mr-0 min-w-32">
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
                    <button
                      type="button"
                      onClick={() => removeInvitee(index)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </ScrollArea>
          </Field>

          <Button
            type="button"
            variant="outline"
            onClick={addInvitee}
            disabled={inviteMembersMutation.isPending}
            className="w-full"
          >
            <Plus className="size-4 mr-2" />
            Add Another Person
          </Button>

          <ul className="text-xs text-neutral-500 list-disc list-inside space-y-1">
            <li>
              <strong>Owner:</strong> Can manage team settings, billing, and members
            </li>
            <li>
              <strong>Member:</strong> Can view and contribute to team projects
            </li>
          </ul>
        </FieldGroup>

        {inviteMembersMutation.error && (
          <p className="text-sm text-destructive">{inviteMembersMutation.error.message}</p>
        )}
        {inviteMembersMutation.isSuccess && (
          <p className="text-sm text-green-400">Invitations sent successfully</p>
        )}

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={inviteMembersMutation.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={
              inviteMembersMutation.isPending || !isValid || inviteMembersMutation.isSuccess
            }
          >
            {inviteMembersMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </form>
    </div>
  );
};

export default InviteMemberModal;
