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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toTitleCase } from "@/lib/utils";
import { MemberRoleEnum, MemberSchemaI } from "@/utils/types";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import React, { useState } from "react";

interface MembersListProps {
  teamId: string;
  members: MemberSchemaI[];
  isLoading: boolean;
}

const MembersList: React.FC<MembersListProps> = ({ teamId, members, isLoading }) => {
  const queryClient = useQueryClient();
  const [selectedMember, setSelectedMember] = useState<MemberSchemaI | null>(null);
  const [selectedAction, setSelectedAction] = useState<"leave" | "remove" | "update" | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRoleEnum>(MemberRoleEnum.MEMBER);

  const { data: currentMember } = useSuspenseQuery({
    queryKey: ["current-member", teamId],
    queryFn: async () => teamActions.getCurrentMember(teamId),
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; toRole: MemberRoleEnum }) =>
      teamActions.updateMember(teamId, data.memberId, { role: data.toRole }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", teamId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => teamActions.removeMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", teamId] });
      queryClient.invalidateQueries({ queryKey: ["subscription", teamId] });
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
                    <Icon size="sm" seed={member.user.id} />
                  </div>
                </TableCell>
                <TableCell>
                  {member.user.username}
                  {member.user.id === currentMember.user.id && (
                    <Badge variant="purple" className="ml-4">
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
