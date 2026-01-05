"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { TeamFormValues } from "@/utils/schema";
import { InviteFormValues, UpdateMemberValues } from "@/utils/schema/invite";
import {
  ApiResponse,
  MemberInviteSchema,
  MemberSchemaI,
  TeamDetailedSchemaI,
  TeamSchemaI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";
import { cookies } from "next/headers";

export const createTeam = async (
  data: TeamFormValues,
): ApiResponse<{ id: string; toInvalidate: QueryKey[] }> => {
  const toInvalidate = [[QUERY_KEYS.TEAMS]];
  return api
    .post("/teams", data)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getTeam = async (teamSlug: string): ApiResponse<TeamDetailedSchemaI> => {
  return api
    .get("/teams", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const deleteTeam = async (
  teamSlug: string,
): ApiResponse<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.TEAMS], [QUERY_KEYS.PROJECTS]];
  const cookieStore = await cookies();
  return api
    .delete("/teams", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      cookieStore.delete("bevor-recent-team");
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateTeam = async (
  teamSlug: string,
  data: TeamFormValues,
): ApiResponse<{
  team: TeamSchemaI;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.TEAMS], [QUERY_KEYS.PROJECTS]];

  return api
    .patch("/teams", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          team: response.data,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getInvites = async (teamSlug: string): ApiResponse<MemberInviteSchema[]> => {
  return api
    .get("/invites", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const inviteMembers = async (
  teamSlug: string,
  data: InviteFormValues,
): ApiResponse<{ toInvalidate: QueryKey[] }> => {
  const toInvalidate = [
    generateQueryKey.invites(teamSlug),
    generateQueryKey.subscription(teamSlug),
  ];
  return api
    .post("/invites", data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const removeInvite = async (
  teamSlug: string,
  inviteId: string,
): ApiResponse<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [
    generateQueryKey.invites(teamSlug),
    generateQueryKey.subscription(teamSlug),
  ];
  return api
    .delete(`/invites/${inviteId}`)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateInvite = async (
  teamSlug: string,
  inviteId: string,
  data: UpdateMemberValues,
): ApiResponse<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [generateQueryKey.invites(teamSlug)];
  return api
    .patch(`/invites/${inviteId}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const acceptInvite = async (
  inviteId: string,
): ApiResponse<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [
    generateQueryKey.userInvites(),
    generateQueryKey.teams(),
    [QUERY_KEYS.PROJECTS],
  ];
  return api
    .post(`/invites/${inviteId}`, {})
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          id: response.data.id,
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateMember = async (
  teamSlug: string,
  memberId: string,
  data: UpdateMemberValues,
): ApiResponse<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [generateQueryKey.members(teamSlug)];
  return api
    .patch(`/members/${memberId}`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const removeMember = async (
  teamSlug: string,
  memberId: string,
): ApiResponse<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [
    generateQueryKey.members(teamSlug),
    generateQueryKey.subscription(teamSlug),
  ];
  return api
    .delete(`/members/${memberId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: {
          toInvalidate,
        },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getMembers = async (teamSlug: string): ApiResponse<MemberSchemaI[]> => {
  return api
    .get("/members", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getCurrentMember = async (teamSlug: string): ApiResponse<MemberSchemaI> => {
  return api
    .get("/members/current", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};
