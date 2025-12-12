"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import {
  CreateTeamBody,
  InviteMemberBody,
  MemberInviteSchema,
  MemberSchemaI,
  TeamDetailedSchemaI,
  TeamSchemaI,
  UpdateMemberBody,
  UpdateTeamBody,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";
import { cookies } from "next/headers";

export const createTeam = async (
  data: CreateTeamBody,
): Promise<{ id: string; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [[QUERY_KEYS.TEAMS]];
  return api.post("/teams", data).then((response) => {
    return {
      id: response.data.id,
      toInvalidate,
    };
  });
};

export const getTeam = async (teamSlug: string): Promise<TeamDetailedSchemaI> => {
  return api.get("/teams", { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return response.data;
  });
};

export const deleteTeam = async (
  teamSlug: string,
): Promise<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.TEAMS], [QUERY_KEYS.PROJECTS]];
  const cookieStore = await cookies();
  return api.delete("/teams", { headers: { "bevor-team-slug": teamSlug } }).then(() => {
    cookieStore.delete("bevor-recent-team");
    return { toInvalidate };
  });
};

export const updateTeam = async (
  teamSlug: string,
  data: UpdateTeamBody,
): Promise<{
  team: TeamSchemaI;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.TEAMS], [QUERY_KEYS.PROJECTS]];

  return api
    .patch("/teams", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return { team: response.data, toInvalidate };
    });
};

export const getInvites = async (teamSlug: string): Promise<MemberInviteSchema[]> => {
  return api.get("/invites", { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return response.data.results;
  });
};

export const inviteMembers = async (
  teamSlug: string,
  data: InviteMemberBody,
): Promise<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [
    generateQueryKey.invites(teamSlug),
    generateQueryKey.subscription(teamSlug),
  ];
  return api.post("/invites", data, { headers: { "bevor-team-slug": teamSlug } }).then(() => {
    return { toInvalidate };
  });
};

export const removeInvite = async (
  teamSlug: string,
  inviteId: string,
): Promise<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [
    generateQueryKey.invites(teamSlug),
    generateQueryKey.subscription(teamSlug),
  ];
  return api.delete(`/invites/${inviteId}`).then(() => {
    return { toInvalidate };
  });
};

export const updateInvite = async (
  teamSlug: string,
  inviteId: string,
  data: UpdateMemberBody,
): Promise<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [generateQueryKey.invites(teamSlug)];
  return api
    .patch(`/invites/${inviteId}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const acceptInvite = async (
  inviteId: string,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [
    generateQueryKey.userInvites(),
    generateQueryKey.teams(),
    [QUERY_KEYS.PROJECTS],
  ];
  return api.post(`/invites/${inviteId}`, {}).then((response) => {
    return {
      id: response.data.id,
      toInvalidate,
    };
  });
};

export const updateMember = async (
  teamSlug: string,
  memberId: string,
  data: UpdateMemberBody,
): Promise<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [generateQueryKey.members(teamSlug)];
  return api
    .patch(`/members/${memberId}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const removeMember = async (
  teamSlug: string,
  memberId: string,
): Promise<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [
    generateQueryKey.members(teamSlug),
    generateQueryKey.subscription(teamSlug),
  ];
  return api
    .delete(`/members/${memberId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then(() => {
      return { toInvalidate };
    });
};

export const getMembers = async (teamSlug: string): Promise<MemberSchemaI[]> => {
  return api.get("/members", { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return response.data.results;
  });
};

export const getCurrentMember = async (teamSlug: string): Promise<MemberSchemaI> => {
  return api
    .get("/members/current", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};
