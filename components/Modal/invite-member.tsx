"use client";

import { bevorAction } from "@/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InviteMemberBody, MemberRoleEnum } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface InviteMemberModalProps {
  onClose: () => void;
  teamName: string;
}

interface Invitee {
  identifier: string;
  role: MemberRoleEnum;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ onClose, teamName }) => {
  const queryClient = useQueryClient();
  const [invitees, setInvitees] = useState<Invitee[]>([
    {
      identifier: "",
      role: MemberRoleEnum.MEMBER,
    },
  ]);

  const { mutate, error, isSuccess, isPending } = useMutation({
    mutationFn: async (params: InviteMemberBody) => bevorAction.inviteMembers(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  useEffect(() => {
    if (!isSuccess) return;
    const timeout = setTimeout(() => {
      onClose();
    }, 1000);

    return (): void => clearTimeout(timeout);
  }, [isSuccess, onClose]);

  const addInvitee = (): void => {
    setInvitees([...invitees, { identifier: "", role: MemberRoleEnum.MEMBER }]);
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

    mutate({ members });
  };

  const isValid = invitees.some((invitee) => invitee.identifier.trim());

  return (
    <form onSubmit={handleSubmit} className="justify-center flex flex-col gap-2">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">Invite Team Members</h2>
            <p className="text-sm text-neutral-400">
              Send invitations to collaborate on {teamName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="p-2 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="py-4 space-y-4">
        <div className="space-y-3">
          {invitees.map((invitee, index) => (
            <div key={index} className="flex items-center space-x-3 bg-neutral-900/50 rounded-lg">
              <div className="flex-1 space-y-2">
                <Input
                  type="text"
                  className="bg-gray-900 rounded px-3 py-2 text-sm w-full"
                  value={invitee.identifier}
                  onChange={(e) => updateInvitee(index, "identifier", e.target.value)}
                  disabled={isPending}
                  placeholder="Enter email address or wallet address"
                />
              </div>
              <div className="flex-shrink-0">
                <select
                  className="px-3 py-2 bg-gray-900 border border-neutral-700 text-neutral-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={invitee.role}
                  onChange={(e) => updateInvitee(index, "role", e.target.value as MemberRoleEnum)}
                  disabled={isPending}
                >
                  <option value={MemberRoleEnum.MEMBER}>Member</option>
                  <option value={MemberRoleEnum.OWNER}>Owner</option>
                </select>
              </div>
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
        </div>

        <Button
          type="button"
          variant="dark"
          onClick={addInvitee}
          disabled={isPending}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Person
        </Button>

        <div className="text-xs text-neutral-500 space-y-1">
          <p>
            • <strong>Owner:</strong> Can manage team settings, billing, and members
          </p>
          <p>
            • <strong>Member:</strong> Can view and contribute to team projects
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error.message}</p>}
        {isSuccess && <p className="text-sm text-green-400">Invitations sent successfully</p>}
      </div>

      <div className="flex justify-between pt-4 border-t border-neutral-800">
        <Button type="button" variant="dark" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="bright" disabled={isPending || !isValid || isSuccess}>
          {isPending
            ? "Sending..."
            : `Send ${invitees.filter((i) => i.identifier.trim()).length} Invitation${invitees.filter((i) => i.identifier.trim()).length !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </form>
  );
};

export default InviteMemberModal;
