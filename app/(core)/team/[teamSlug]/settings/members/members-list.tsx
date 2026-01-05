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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toTitleCase } from "@/lib/utils";
import { generateQueryKey } from "@/utils/constants";
import { MemberRoleEnum } from "@/utils/enums";
import { MemberSchemaI } from "@/utils/types";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import React, { useState } from "react";

interface MembersListProps {
  teamSlug: string;
  members: MemberSchemaI[];
  isLoading: boolean;
}

const MembersList: React.FC<MembersListProps> = ({ teamSlug, members, isLoading }) => {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<MemberSchemaI | null>(null);
  const [selectedAction, setSelectedAction] = useState<"leave" | "remove" | "update" | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRoleEnum>(MemberRoleEnum.MEMBER);

  const { data: currentMember } = useSuspenseQuery({
    queryKey: generateQueryKey.currentMember(teamSlug),
    queryFn: async () =>
      teamActions.getCurrentMember(teamSlug).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; toRole: MemberRoleEnum }) =>
      teamActions.updateMember(teamSlug, data.memberId, { role: data.toRole }).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) =>
      teamActions.removeMember(teamSlug, memberId).then((r) => {
        if (!r.ok) throw r;
        return r.data;
      }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleAction = (member: MemberSchemaI, action: "leave" | "remove" | "update"): void => {
    setSelectedMember(member);
    setSelectedRole(member.role);
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
      <AlertDialog open={selectedAction === "update"} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change the role for {selectedMember?.user.username}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <FieldGroup>
              <FieldSet>
                <FieldLabel htmlFor="compute-environment-p8w" className="sr-only">
                  Member Role
                </FieldLabel>
                <FieldDescription className="sr-only">
                  Update the role of the invited user
                </FieldDescription>
                <RadioGroup
                  defaultValue={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as MemberRoleEnum)}
                >
                  <FieldLabel htmlFor="kubernetes-r2h">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Owner</FieldTitle>
                        <FieldDescription>
                          Owners can update billing, invite, update, and remove users.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={MemberRoleEnum.OWNER} id="kubernetes-r2h" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="vm-z4k">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Member</FieldTitle>
                        <FieldDescription>
                          Members can do mostly everything except update billing.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={MemberRoleEnum.MEMBER} id="vm-z4k" />
                    </Field>
                  </FieldLabel>
                </RadioGroup>
              </FieldSet>
            </FieldGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedMember) {
                  updateMemberMutation.mutate({
                    memberId: selectedMember.id,
                    toRole: selectedRole,
                  });
                  handleClose();
                }
              }}
            >
              Update Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ScrollArea className="w-full pb-4">
        <div className="space-y-2">
          {isLoading &&
            [0, 1, 2].map((ind) => (
              <div key={ind} className="flex items-center gap-4 p-3 border rounded-lg">
                <Skeleton className="size-icon-sm rounded-full" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          {members?.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex items-center">
                <Icon size="sm" seed={member.user.id} />
              </div>
              <div className="flex items-center gap-2 flex-1">
                <span>{member.user.username}</span>
                {member.user.id === currentMember.user.id && (
                  <Badge variant="purple" size="sm">
                    You
                  </Badge>
                )}
              </div>
              <Badge variant={member.role === MemberRoleEnum.MEMBER ? "green" : "blue"} size="sm">
                {toTitleCase(member.role)}
              </Badge>
              <span className="text-sm text-muted-foreground w-24">
                {formatDate(member.created_at)}
              </span>
              {member.can_update || member.can_remove ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
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
                    {member.can_remove && currentMember.id === member.id && (
                      <DropdownMenuItem
                        onClick={() => handleAction(member, "leave")}
                        variant="destructive"
                      >
                        Leave Team
                      </DropdownMenuItem>
                    )}
                    {member.can_remove && currentMember.id !== member.id && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleAction(member, "remove")}
                      >
                        Remove Member
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="h-8 w-8" />
              )}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
};

export default MembersList;
