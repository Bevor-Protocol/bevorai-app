import ChangeRoleModal from "@/components/Modal/change-role";
import { useModal } from "@/hooks/useContexts";
import { MemberRoleEnum } from "@/utils/types";
import { Crown, User } from "lucide-react";
import React from "react";

type RoleProps = {
  memberId: string;
  memberIdentifier: string;
  fromRole: MemberRoleEnum;
  close?: () => void;
};

const RoleUpdateDropdown: React.FC<RoleProps> = ({
  memberId,
  memberIdentifier,
  fromRole,
  close,
}) => {
  const { hide, show } = useModal();

  const handleRoleUpdate = ({ toRole }: { toRole: MemberRoleEnum }): void => {
    if (fromRole === toRole) {
      if (close) close();
      return;
    }
    show(
      <ChangeRoleModal
        onClose={hide}
        fromRole={fromRole}
        toRole={toRole}
        memberId={memberId}
        memberIdentifier={memberIdentifier}
      />,
    );
    if (close) close();
  };

  const getRoleIcon = (role: MemberRoleEnum): React.ReactElement => {
    switch (role) {
      case MemberRoleEnum.OWNER:
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case MemberRoleEnum.MEMBER:
        return <User className="w-4 h-4 text-neutral-400" />;
      default:
        return <User className="w-4 h-4 text-neutral-400" />;
    }
  };

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
    <div className="py-1 min-w-[200px]">
      <div
        onClick={() => handleRoleUpdate({ toRole: MemberRoleEnum.OWNER })}
        className={`flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors ${
          fromRole === MemberRoleEnum.OWNER
            ? "bg-neutral-800 text-neutral-200"
            : "hover:bg-neutral-800/50 text-neutral-300 hover:text-neutral-200"
        }`}
      >
        <div className="flex-shrink-0">{getRoleIcon(MemberRoleEnum.OWNER)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Owner</span>
            {fromRole === MemberRoleEnum.OWNER && (
              <span className="text-xs text-neutral-500">(Current)</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {getRoleDescription(MemberRoleEnum.OWNER)}
          </p>
        </div>
      </div>

      <div
        onClick={() => handleRoleUpdate({ toRole: MemberRoleEnum.MEMBER })}
        className={`flex items-center space-x-3 px-3 py-2 cursor-pointer transition-colors ${
          fromRole === MemberRoleEnum.MEMBER
            ? "bg-neutral-800 text-neutral-200"
            : "hover:bg-neutral-800/50 text-neutral-300 hover:text-neutral-200"
        }`}
      >
        <div className="flex-shrink-0">{getRoleIcon(MemberRoleEnum.MEMBER)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium">Member</span>
            {fromRole === MemberRoleEnum.MEMBER && (
              <span className="text-xs text-neutral-500">(Current)</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {getRoleDescription(MemberRoleEnum.MEMBER)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleUpdateDropdown;
