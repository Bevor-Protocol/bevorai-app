"use server";

import { businessApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import { ActivitySchema } from "@/types/api/responses/business";

export const getTeamActivities = async (teamSlug: string): ApiResponse<ActivitySchema[]> => {
  return businessApi
    .get("/activities", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return { ok: true as const, data: response.data.results, requestId };
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

export const getProjectActivities = async (
  teamSlug: string,
  projectSlug: string,
): ApiResponse<ActivitySchema[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set("project_slug", projectSlug);

  return businessApi
    .get(`/activities?${searchParams}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return { ok: true as const, data: response.data.results, requestId };
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
