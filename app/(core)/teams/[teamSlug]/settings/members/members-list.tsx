"use client";

import { bevorAction } from "@/actions";
import RemoveMemberModal from "@/components/Modal/remove-member";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toTitleCase } from "@/lib/utils";
import { trimAddress } from "@/utils/helpers";
import { MemberRoleEnum, MemberSchema, TeamSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";
import React from "react";

interface MembersListProps {
  team: TeamSchemaI;
  curMember: MemberSchema;
  members: MemberSchema[];
  isLoading: boolean;
}

const MemberDescriptionItem: React.FC<{
  targetRole: MemberRoleEnum;
  currrentRole: MemberRoleEnum;
  handleUpdate: () => void;
}> = ({ targetRole, currrentRole, handleUpdate }) => {
  const getRoleDescription = (role: MemberRoleEnum): string => {
    switch (role) {
      case MemberRoleEnum.OWNER:
        return "Can manage team settings, billing, and members";
      case MemberRoleEnum.MEMBER:
        return "Can view and contribute to team projects";
      default:
        return "Can view and contribute to team projects";
    }
  };

  return (
    <SelectItem value={targetRole} disabled={currrentRole === targetRole} onClick={handleUpdate}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold">{toTitleCase(targetRole)}</span>
          {currrentRole === targetRole && (
            <span className="text-xs text-neutral-500">(current)</span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">{getRoleDescription(targetRole)}</p>
      </div>
    </SelectItem>
  );
};

const MembersList: React.FC<MembersListProps> = ({ team, curMember, members, isLoading }) => {
  const queryClient = useQueryClient();

  const updateMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; toRole: MemberRoleEnum }) =>
      bevorAction.updateMember(data.memberId, { role: data.toRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const getDisplayIdentifier = (identifier: string): string => {
    if (identifier.includes("@")) {
      return identifier;
    }
    return trimAddress(identifier);
  };

  if (isLoading) {
    return (
      <div className="border border-blue-500/50 rounded divide-blue-500/25 divide-y">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex flex-row gap-4 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-blue-500/50 rounded divide-blue-500/25 divide-y">
      {members?.map((member) => (
        <div key={member.id} className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="flex flex-row gap-4 items-center">
              <div className="text-sm font-medium text-neutral-100">
                {getDisplayIdentifier(member.identifier)}
              </div>
              {member.id === curMember.id && (
                <div className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded inline-block mt-0.5">
                  You
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select defaultValue={member.role} disabled={!member.can_update}>
              <SelectTrigger className="text-xs font-bold h-8!">
                <SelectValue>{toTitleCase(member.role)}</SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <MemberDescriptionItem
                    currrentRole={member.role}
                    targetRole={MemberRoleEnum.OWNER}
                    handleUpdate={() =>
                      updateMemberMutation.mutate({
                        memberId: member.id,
                        toRole: MemberRoleEnum.OWNER,
                      })
                    }
                  />
                  <MemberDescriptionItem
                    currrentRole={member.role}
                    targetRole={MemberRoleEnum.MEMBER}
                    handleUpdate={() =>
                      updateMemberMutation.mutate({
                        memberId: member.id,
                        toRole: MemberRoleEnum.MEMBER,
                      })
                    }
                  />
                </SelectGroup>
              </SelectContent>
            </Select>
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={!member.can_remove} size="sm" variant="destructive">
                  {curMember.id === member.id ? "Leave" : "Remove"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <RemoveMemberModal teamName={team.name} memberId={member.id} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MembersList;
