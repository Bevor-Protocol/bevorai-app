import { teamActions } from "@/actions/bevor";
import { DropdownMenuGroup, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MemberRoleEnum } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";

type RoleProps = {
  memberId: string;
  fromRole: MemberRoleEnum;
};

const RoleUpdateDropdown: React.FC<RoleProps> = ({ memberId, fromRole }) => {
  const queryClient = useQueryClient();

  const updateMemberMutation = useMutation({
    mutationFn: async (toRole: MemberRoleEnum) =>
      teamActions.updateMember(memberId, { role: toRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

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
    <DropdownMenuGroup>
      <DropdownMenuItem
        disabled={fromRole === MemberRoleEnum.OWNER}
        onClick={() => updateMemberMutation.mutate(MemberRoleEnum.OWNER)}
        className={`flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors ${
          fromRole === MemberRoleEnum.OWNER
            ? "bg-neutral-800 text-neutral-200"
            : "hover:bg-neutral-800/50 text-foreground hover:text-neutral-200"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold">Owner</span>
            {fromRole === MemberRoleEnum.OWNER && (
              <span className="text-xs text-neutral-500">(Current)</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {getRoleDescription(MemberRoleEnum.OWNER)}
          </p>
        </div>
      </DropdownMenuItem>

      <DropdownMenuItem
        disabled={fromRole === MemberRoleEnum.MEMBER}
        onClick={() => updateMemberMutation.mutate(MemberRoleEnum.MEMBER)}
        className={`flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors ${
          fromRole === MemberRoleEnum.MEMBER
            ? "bg-neutral-800 text-neutral-200"
            : "hover:bg-neutral-800/50 text-foreground hover:text-neutral-200"
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold">Member</span>
            {fromRole === MemberRoleEnum.MEMBER && (
              <span className="text-xs text-neutral-500">(Current)</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {getRoleDescription(MemberRoleEnum.MEMBER)}
          </p>
        </div>
      </DropdownMenuItem>
    </DropdownMenuGroup>
  );
};

export default RoleUpdateDropdown;
