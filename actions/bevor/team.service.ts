"use server";

import api from "@/lib/api";
import {
  CreateTeamBody,
  InviteMemberBody,
  MemberInviteSchema,
  MemberSchemaI,
  TeamOverviewSchemaI,
  UpdateMemberBody,
  UpdateTeamBody,
} from "@/utils/types";
import { cookies } from "next/headers";

export const createTeam = async (data: CreateTeamBody): Promise<string> => {
  return api.post("/teams", data).then((response) => {
    return response.data.id;
  });
};

export const getTeam = async (teamId: string): Promise<TeamOverviewSchemaI> => {
  return api.get("/teams", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data;
  });
};

export const deleteTeam = async (teamId: string): Promise<boolean> => {
  const cookieStore = await cookies();
  return api.delete("/teams", { headers: { "bevor-team-id": teamId } }).then((response) => {
    cookieStore.delete("bevor-recent-team");
    return response.data.success;
  });
};

export const updateTeam = async (teamId: string, data: UpdateTeamBody): Promise<boolean> => {
  return api.patch("/teams", data, { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.success;
  });
};

export const getInvites = async (teamId: string): Promise<MemberInviteSchema[]> => {
  return api.get("/invites", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.results;
  });
};

export const inviteMembers = async (teamId: string, data: InviteMemberBody): Promise<boolean> => {
  return api.post("/invites", data, { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.success;
  });
};

export const removeInvite = async (teamId: string, inviteId: string): Promise<boolean> => {
  return api
    .delete(`/invites/${inviteId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};

export const updateInvite = async (
  teamId: string,
  inviteId: string,
  data: UpdateMemberBody,
): Promise<boolean> => {
  return api
    .patch(`/invites/${inviteId}`, data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};

export const acceptInvite = async (teamId: string, inviteId: string): Promise<string> => {
  return api
    .post(`/invites/${inviteId}`, {}, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};

export const updateMember = async (
  teamId: string,
  memberId: string,
  data: UpdateMemberBody,
): Promise<boolean> => {
  return api
    .patch(`/members/${memberId}`, data, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};

export const removeMember = async (teamId: string, memberId: string): Promise<boolean> => {
  return api
    .delete(`/members/${memberId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.success;
    });
};

export const getMembers = async (teamId: string): Promise<MemberSchemaI[]> => {
  return api.get("/members", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data.results;
  });
};

export const getCurrentMember = async (teamId: string): Promise<MemberSchemaI> => {
  return api.get("/members/current", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data;
  });
};
