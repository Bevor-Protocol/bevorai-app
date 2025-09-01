"use client";

import { bevorAction } from "@/actions";
import InviteMemberModal from "@/components/Modal/invite-member";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useContexts";
import { MemberSchema, TeamSchemaI } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import React from "react";
import InvitesList from "./invites-list";
import MembersList from "./members-list";

interface MembersTabsProps {
  team: TeamSchemaI;
  curMember: MemberSchema;
}

const MembersTabs: React.FC<MembersTabsProps> = ({ team, curMember }) => {
  const { hide, show } = useModal();
  const [activeTab, setActiveTab] = React.useState<"members" | "invites">("members");

  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["members", team.id],
    queryFn: async () => bevorAction.getMembers(),
  });

  const { data: invites, isLoading: isLoadingInvites } = useQuery({
    queryKey: ["invites", team.id],
    queryFn: async () => bevorAction.getInvites(),
  });

  const handleInvite = (): void => {
    show(<InviteMemberModal teamName={team.name} onClose={hide} />);
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => setActiveTab("members")}
            className="nav-item cursor-pointer"
            data-active={activeTab == "members"}
          >
            <span>Members</span>
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            className="nav-item cursor-pointer"
            data-active={activeTab == "invites"}
          >
            <span>Invites</span>
            {(invites?.length ?? 0) > 0 && (
              <span className="w-2 h-2 bg-green-500 rounded-full absolute top-2 right-0" />
            )}
          </button>
        </div>
        {curMember.role === "owner" && (
          <Button variant="bright" onClick={handleInvite}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === "members" ? (
          <MembersList
            team={team}
            curMember={curMember}
            members={members ?? []}
            isLoading={isLoadingMembers}
          />
        ) : (
          <InvitesList curMember={curMember} invites={invites ?? []} isLoading={isLoadingInvites} />
        )}
      </div>
    </>
  );
};

export default MembersTabs;
