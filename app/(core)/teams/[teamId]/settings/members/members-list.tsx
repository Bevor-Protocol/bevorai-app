"use client";

import { teamActions } from "@/actions/bevor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toTitleCase } from "@/lib/utils";
import { trimAddress } from "@/utils/helpers";
import { MemberRoleEnum, MemberSchema, TeamSchemaI } from "@/utils/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import React, { useState } from "react";

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
  const [selectedMember, setSelectedMember] = useState<MemberSchema | null>(null);
  const [selectedAction, setSelectedAction] = useState<"leave" | "remove" | "update" | null>(null);

  const updateMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; toRole: MemberRoleEnum }) =>
      teamActions.updateMember(data.memberId, { role: data.toRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => teamActions.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const getDisplayIdentifier = (identifier: string): string => {
    if (identifier.includes("@")) {
      return identifier;
    }
    return trimAddress(identifier);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAction = (member: MemberSchema, action: "leave" | "remove" | "update"): void => {
    setSelectedMember(member);
    setSelectedAction(action);
  };

  const handleClose = (): void => {
    setSelectedAction(null);
    setSelectedMember(null);
  };

  return (
    <>
      <AlertDialog open={selectedAction === "leave"} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to all data associated with this team. Someone will have to
              invite you again if you want to rejoin.
              <div className="space-y-2">
                <label className="text-md font-medium text-neutral-200">
                  What happens when you leave:
                </label>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• You will lose access to all team projects and resources</li>
                  <li>• Your team membership will be permanently removed</li>
                  <li>• You will need to be re-invited to rejoin the team</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMemberMutation.mutate(selectedMember!.id)}
              variant="destructive"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={selectedAction === "remove"} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You can add this user back whenever. You might want to revoke any API keys they have
              access to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMemberMutation.mutate(selectedMember!.id)}
              variant="destructive"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* <AlertDialog open={selectedAction === "update"} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will revoke the key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteApiKeyMutation.mutate(selectedKey!)}
              variant="destructive"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
      <ScrollArea className="w-full pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-icon-sm" />
              <TableHead className="w-[65%]">Member</TableHead>
              <TableHead className="w-[10%]">Role</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[10%]">Joined</TableHead>
              <TableHead className="text-right w-[5%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2].map((ind) => (
                <TableRow key={ind}>
                  <TableCell>
                    <Skeleton className="size-icon-sm rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8" />
                  </TableCell>
                </TableRow>
              ))}
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Icon size="sm" seed={member.user_id} />
                  </div>
                </TableCell>
                <TableCell>
                  {getDisplayIdentifier(member.identifier)}
                  {member.id === curMember.id && (
                    <Badge variant="blue" className="ml-4">
                      You
                    </Badge>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={member.role === MemberRoleEnum.MEMBER ? "green" : "blue"}>
                    {toTitleCase(member.role)}
                  </Badge>
                </TableCell>
                <TableCell>active</TableCell>
                <TableCell>{formatDate(member.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      disabled={!member.can_update && !member.can_remove}
                    >
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.can_update && (
                        <DropdownMenuItem onClick={() => handleAction(member, "update")}>
                          Update Role
                        </DropdownMenuItem>
                      )}
                      {member.can_remove && curMember.id === member.id && (
                        <DropdownMenuItem
                          onClick={() => handleAction(member, "leave")}
                          variant="destructive"
                        >
                          Leave Team
                        </DropdownMenuItem>
                      )}
                      {member.can_remove && curMember.id !== member.id && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleAction(member, "remove")}
                        >
                          Remove Member
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
};

export default MembersList;
