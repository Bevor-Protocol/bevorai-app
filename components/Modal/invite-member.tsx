"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { InviteMemberBody, MemberRoleEnum } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import React, { useRef, useState } from "react";

interface Invitee {
  identifier: string;
  role: MemberRoleEnum;
}

const InviteMemberModal: React.FC<{ teamName: string }> = ({ teamName }) => {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [invitees, setInvitees] = useState<Invitee[]>([
    {
      identifier: "",
      role: MemberRoleEnum.MEMBER,
    },
  ]);

  const inviteMembersMutation = useMutation({
    mutationFn: async (params: InviteMemberBody) => bevorAction.inviteMembers(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
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

  const updateInvitee = (index: number, field: keyof Invitee, value: string): void => {
    setInvitees(
      invitees.map((invitee, i) => (i === index ? { ...invitee, [field]: value } : invitee)),
    );
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    const validInvitees = invitees.filter((invitee) => invitee.identifier.trim());
    if (validInvitees.length === 0) return;

    const members = validInvitees.map((invitee) => ({
      identifier: invitee.identifier.trim(),
      role: invitee.role,
    }));

    inviteMembersMutation.mutate({ members });
  };

  const isValid = invitees.some((invitee) => invitee.identifier.trim());

  return (
    <div>
      <DialogHeader>
        <div className="inline-flex gap-2 items-center">
          <Users className="size-5 text-blue-400" />
          <DialogTitle>Invite Team Member(s)</DialogTitle>
        </div>
        <DialogDescription>Send invitations to collaborate on {teamName}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
        <div className="py-4 space-y-4">
          <ScrollArea className="space-y-3 h-[calc(44px*5)]" viewportRef={scrollRef} type="auto">
            {invitees.map((invitee, index) => (
              <div key={index} className="flex items-center gap-3 py-1 pr-4 pl-1">
                <Input
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
                  <SelectTrigger className="mr-0 min-w-32">
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
                    className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </ScrollArea>

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
          {inviteMembersMutation.error && (
            <p className="text-sm text-red-400">{inviteMembersMutation.error.message}</p>
          )}
          {inviteMembersMutation.isSuccess && (
            <p className="text-sm text-green-400">Invitations sent successfully</p>
          )}
        </div>

        <DialogFooter>
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
