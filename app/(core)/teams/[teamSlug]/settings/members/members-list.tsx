"use client";

import RoleUpdateDropdown from "@/components/Dropdown/role";
import RemoveMemberModal from "@/components/Modal/remove-member";
import { Button } from "@/components/ui/button";
import * as Dropdown from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/loader";
import { useModal } from "@/hooks/useContexts";
import { cn } from "@/lib/utils";
import { trimAddress } from "@/utils/helpers";
import { MemberSchema, TeamSchemaI } from "@/utils/types";
import { ChevronDown, User } from "lucide-react";
import React from "react";

interface MembersListProps {
  team: TeamSchemaI;
  curMember: MemberSchema;
  members: MemberSchema[];
  isLoading: boolean;
}

const MembersList: React.FC<MembersListProps> = ({ team, curMember, members, isLoading }) => {
  const { hide, show } = useModal();

  const getDisplayIdentifier = (identifier: string): string => {
    if (identifier.includes("@")) {
      return identifier;
    }
    return trimAddress(identifier);
  };

  const handleRemove = ({ member }: { member: MemberSchema }): void => {
    if (!member.can_remove) return;
    show(<RemoveMemberModal onClose={hide} memberId={member.id} teamName={team.name} />);
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
            <Dropdown.Main
              className="flex flex-row relative cursor-pointer rounded-lg focus-border"
              tabIndex={0}
            >
              <Dropdown.Trigger isDisabled={!member.can_update}>
                <Button
                  variant="dark"
                  disabled={!member.can_update}
                  className="relative text-xs h-8 px-3"
                >
                  {member.role}
                  <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-1" />
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Content className="top-full right-0" hasCloseTrigger>
                <RoleUpdateDropdown
                  fromRole={member.role}
                  memberId={member.id}
                  memberIdentifier={member.identifier}
                />
              </Dropdown.Content>
            </Dropdown.Main>
            <Button
              variant="dark"
              onClick={() => handleRemove({ member })}
              disabled={!member.can_remove}
              className={cn(
                "text-red-400 text-xs h-8 px-3",
                !member.can_remove && "opacity-50 cursor-not-allowed",
                member.can_remove && "hover:text-red-300",
              )}
            >
              {curMember.id === member.id ? "Leave" : "Remove"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MembersList;
