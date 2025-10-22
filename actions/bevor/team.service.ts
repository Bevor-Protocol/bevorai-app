"use server";

import api from "@/lib/api";
import {
  CreateTeamBody,
  InviteMemberBody,
  MemberInviteSchema,
  MemberSchema,
  TeamSchemaI,
  UpdateMemberBody,
  UpdateTeamBody,
} from "@/utils/types";
import { cookies } from "next/headers";

export const createTeam = async (data: CreateTeamBody): Promise<TeamSchemaI> => {
  return api.post("/teams", data).then((response) => {
    return response.data;
  });
};

export const getTeam = async (): Promise<TeamSchemaI> => {
  return api.get("/teams").then((response) => {
    return response.data;
  });
};

export const getTeams = async (): Promise<TeamSchemaI[]> => {
  return api.get("/teams/all", { headers: { "skip-team": true } }).then((response) => {
    return response.data.results;
  });
};

export const deleteTeam = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  return api.delete("/teams").then((response) => {
    cookieStore.delete("bevor-recent-team");
    return response.data.success;
  });
};

export const updateTeam = async (data: UpdateTeamBody): Promise<TeamSchemaI> => {
  return api.patch("/teams", data).then((response) => {
    return response.data;
  });
};

export const getInvites = async (): Promise<MemberInviteSchema[]> => {
  return api.get("/team-members/invites").then((response) => {
    return response.data.results;
  });
};

export const inviteMembers = async (data: InviteMemberBody): Promise<boolean> => {
  return api.post("/team-members/invites", data).then((response) => {
    return response.data.success;
  });
};

export const removeInvite = async (inviteId: string): Promise<boolean> => {
  return api.delete(`/team-members/invites/${inviteId}`).then((response) => {
    return response.data.success;
  });
};

export const updateInvite = async (inviteId: string, data: UpdateMemberBody): Promise<boolean> => {
  return api.patch(`/team-members/invites/${inviteId}`, data).then((response) => {
    return response.data.success;
  });
};

export const acceptInvite = async (inviteId: string): Promise<string> => {
  return api.post(`/team-members/invites/${inviteId}`, {}).then((response) => {
    return response.data.id;
  });
};

export const updateMember = async (memberId: string, data: UpdateMemberBody): Promise<boolean> => {
  return api.patch(`/team-members/members/${memberId}`, data).then((response) => {
    return response.data.success;
  });
};

export const removeMember = async (memberId: string): Promise<boolean> => {
  return api.delete(`/team-members/members/${memberId}`).then((response) => {
    return response.data.success;
  });
};

export const getMembers = async (): Promise<MemberSchema[]> => {
  return api.get("/team-members/members").then((response) => {
    return response.data.results;
  });
};

export const getCurrentMember = async (): Promise<MemberSchema> => {
  return api.get("/team-members/members/current").then((response) => {
    return response.data;
  });
};
