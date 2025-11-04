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
import { trimAddress } from "@/utils/helpers";
import { MemberInviteSchema, MemberRoleEnum } from "@/utils/types";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Mail, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface InvitesListProps {
  teamId: string;
  invites: MemberInviteSchema[];
  isLoading: boolean;
}

const InvitesList: React.FC<InvitesListProps> = ({ teamId, invites, isLoading }) => {
  const queryClient = useQueryClient();
  const [selectedInvite, setSelectedInvite] = useState<MemberInviteSchema | null>(null);
  const [selectedAction, setSelectedAction] = useState<"update" | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRoleEnum>(MemberRoleEnum.MEMBER);

  const { data: currentMember } = useSuspenseQuery({
    queryKey: ["current-member", teamId],
    queryFn: async () => teamActions.getCurrentMember(teamId),
  });

  const removeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => teamActions.removeInvite(teamId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", teamId] });
      queryClient.invalidateQueries({ queryKey: ["subscription", teamId] });
    },
  });

  const updateInviteMutation = useMutation({
    mutationFn: async (data: { inviteId: string; role: MemberRoleEnum }) =>
      teamActions.updateInvite(teamId, data.inviteId, { role: data.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invites", teamId] });
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

  const handleAction = (invite: MemberInviteSchema, action: "update"): void => {
    setSelectedInvite(invite);
    setSelectedRole(invite.role);
    setSelectedAction(action);
  };

  const handleClose = (): void => {
    setSelectedAction(null);
    setSelectedInvite(null);
  };

  return (
    <>
      <AlertDialog open={selectedAction === "update"} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Invite Role</AlertDialogTitle>
            <AlertDialogDescription>
              Change the role for {selectedInvite?.identifier}
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
                  <FieldLabel htmlFor="owner">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Owner</FieldTitle>
                        <FieldDescription>
                          Owners can update billing, invite, update, and remove users.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={MemberRoleEnum.OWNER} id="owner" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel htmlFor="member">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Member</FieldTitle>
                        <FieldDescription>
                          Members can do mostly everything except update billing.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={MemberRoleEnum.MEMBER} id="member" />
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
                if (selectedInvite) {
                  updateInviteMutation.mutate({
                    inviteId: selectedInvite.id,
                    role: selectedRole,
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
              <TableHead className="w-[65%]">Invite</TableHead>
              <TableHead className="w-[10%]">Role</TableHead>
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[10%]">Invited At</TableHead>
              <TableHead className="text-right w-[5%]" />
            </TableRow>
          </TableHeader>
          <TableBody className="border-primary">
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
            {!invites || invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No pending invites
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>
                    {invite.user_id ? (
                      <Icon size="sm" seed={invite.user_id} />
                    ) : (
                      <Mail className="size-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>{getDisplayIdentifier(invite.identifier)}</TableCell>
                  <TableCell>
                    <Button disabled variant="outline" size="sm">
                      {invite.role}
                    </Button>
                  </TableCell>
                  <TableCell>{invite.user_id ? "user" : "not user"}</TableCell>
                  <TableCell>{formatDate(invite.created_at)}</TableCell>
                  <TableCell
                    className="text-right"
                    aria-disabled={currentMember.role !== MemberRoleEnum.OWNER}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        disabled={currentMember.role !== MemberRoleEnum.OWNER}
                      >
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction(invite, "update")}>
                          Update Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => removeInviteMutation.mutate(invite.id)}
                          variant="destructive"
                        >
                          Remove Invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
};

export default InvitesList;
