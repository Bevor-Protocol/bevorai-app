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
import { generateQueryKey } from "@/utils/constants";
import { MemberRoleEnum } from "@/utils/enums";
import { trimAddress } from "@/utils/helpers";
import { UpdateMemberValues } from "@/utils/schema/invite";
import { MemberInviteSchema } from "@/utils/types";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Mail, MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface InvitesListProps {
  teamSlug: string;
  invites: MemberInviteSchema[];
  isLoading: boolean;
}

const InvitesList: React.FC<InvitesListProps> = ({ teamSlug, invites, isLoading }) => {
  const queryClient = useQueryClient();
  const [selectedInvite, setSelectedInvite] = useState<MemberInviteSchema | null>(null);
  const [selectedAction, setSelectedAction] = useState<"update" | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRoleEnum>(MemberRoleEnum.MEMBER);

  const { data: currentMember } = useSuspenseQuery({
    queryKey: generateQueryKey.currentMember(teamSlug),
    queryFn: async () => teamActions.getCurrentMember(teamSlug),
  });

  const removeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => teamActions.removeInvite(teamSlug, inviteId),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });

  const updateInviteMutation = useMutation({
    mutationFn: async (data: UpdateMemberValues & { inviteId: string }) =>
      teamActions.updateInvite(teamSlug, data.inviteId, { role: data.role }),
    onSuccess: ({ toInvalidate }) => {
      toInvalidate.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
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
          {!invites || invites.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No pending invites</div>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center">
                  {invite.user_id ? (
                    <Icon size="sm" seed={invite.user_id} />
                  ) : (
                    <Mail className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">{getDisplayIdentifier(invite.identifier)}</div>
                <Badge variant="outline" size="sm">
                  {invite.role}
                </Badge>
                <span className="text-sm text-muted-foreground w-24">
                  {formatDate(invite.created_at)}
                </span>
                {currentMember.role === MemberRoleEnum.OWNER ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
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
                ) : (
                  <div className="h-8 w-8" />
                )}
              </div>
            ))
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </>
  );
};

export default InvitesList;
