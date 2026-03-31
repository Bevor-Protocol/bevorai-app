"use server";

import { businessApi } from "@/lib/api";
import { ApiError, ApiResponse } from "@/types/api";
import type {
  AdminActivityAuditRow,
  AdminAdminAccountRow,
  AdminAnalysisNodeAuditRow,
  AdminAnalysisStatusCount,
  AdminAnalysisTriggerCount,
  AdminAuthProviderUserCount,
  AdminBooleanResponse,
  AdminCodeMappingAuditRow,
  AdminDailyActivityRowCount,
  AdminDailyCountPoint,
  AdminDistinctDailyUsers,
  AdminMetricCount,
  AdminMetricDaysWindowQuery,
  AdminMetricLargestTeamsQuery,
  AdminMetricSinceQuery,
  AdminMetricUsersCountQuery,
  AdminOAuthConnectionMeta,
  AdminOauthProviderCountRow,
  AdminRecentUsersQuery,
  AdminSearchQuery,
  AdminSignupTimeseriesPoint,
  AdminTeamActivitiesQuery,
  AdminTeamAnalysisNodesQuery,
  AdminTeamDetail,
  AdminTeamInviteRow,
  AdminTeamLeaderboardRow,
  AdminTeamMemberRow,
  AdminTeamMembershipRow,
  AdminTeamPlanCountRow,
  AdminTeamProjectRow,
  AdminTeamSearchRow,
  AdminTeamUsageEventsQuery,
  AdminTimeseriesAnalysisNodesQuery,
  AdminTimeseriesDaysQuery,
  AdminTimeseriesScopeQuery,
  AdminTimeseriesSignupsQuery,
  AdminUsageEventRow,
  AdminUsageEventsByResource,
  AdminUserActivitiesQuery,
  AdminUserAnalysisNodesQuery,
  AdminUserCodeMappingsQuery,
  AdminUserCreatorSummary,
  AdminUserDailyActivityQuery,
  AdminUserDailyActivityRow,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserSignupBounds,
  AdminUserUsageEventsQuery,
} from "@/types/api/responses/admin";
import { AxiosError } from "axios";

type AdminParams = Record<string, unknown>;

const apiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const requestId = (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
    return {
      ok: false as const,
      error: error.response?.data ?? { message: error.message },
      requestId,
    };
  }
  return {
    ok: false as const,
    error: { message: error instanceof Error ? error.message : String(error) },
    requestId: "",
  };
};

export const isAdmin = async (): ApiResponse<AdminBooleanResponse> => {
  return businessApi
    .get<AdminBooleanResponse>("/admin/status")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUsersSearch = async (
  params?: AdminSearchQuery,
): ApiResponse<AdminUserListItem[]> => {
  return businessApi
    .get<{ results: AdminUserListItem[] }>("/admin/users/search", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUsersRecent = async (
  params?: AdminRecentUsersQuery,
): ApiResponse<AdminUserListItem[]> => {
  return businessApi
    .get<{ results: AdminUserListItem[] }>("/admin/users/recent", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUsersByProvider = async (): ApiResponse<AdminAuthProviderUserCount[]> => {
  return businessApi
    .get<{ results: AdminAuthProviderUserCount[] }>("/admin/users/by-provider")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUsersAdmins = async (): ApiResponse<AdminAdminAccountRow[]> => {
  return businessApi
    .get<{ results: AdminAdminAccountRow[] }>("/admin/users/admins")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserGet = async (userId: string): ApiResponse<AdminUserDetail | null> => {
  return businessApi
    .get<AdminUserDetail | null>(`/admin/users/${encodeURIComponent(userId)}`)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminUserTeamMemberships = async (
  userId: string,
): ApiResponse<AdminTeamMembershipRow[]> => {
  return businessApi
    .get<{ results: AdminTeamMembershipRow[] }>(
      `/admin/users/${encodeURIComponent(userId)}/team-memberships`,
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserOauth = async (userId: string): ApiResponse<AdminOAuthConnectionMeta[]> => {
  return businessApi
    .get<{ results: AdminOAuthConnectionMeta[] }>(
      `/admin/users/${encodeURIComponent(userId)}/oauth`,
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserDailyActivity = async (
  userId: string,
  params?: AdminUserDailyActivityQuery,
): ApiResponse<AdminUserDailyActivityRow[]> => {
  return businessApi
    .get<{ results: AdminUserDailyActivityRow[] }>(
      `/admin/users/${encodeURIComponent(userId)}/daily-activity`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserRecentAnalysisNodes = async (
  userId: string,
  params?: AdminUserAnalysisNodesQuery,
): ApiResponse<AdminAnalysisNodeAuditRow[]> => {
  return businessApi
    .get<{ results: AdminAnalysisNodeAuditRow[] }>(
      `/admin/users/${encodeURIComponent(userId)}/analysis-nodes/recent`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserRecentCodeMappings = async (
  userId: string,
  params?: AdminUserCodeMappingsQuery,
): ApiResponse<AdminCodeMappingAuditRow[]> => {
  return businessApi
    .get<{ results: AdminCodeMappingAuditRow[] }>(
      `/admin/users/${encodeURIComponent(userId)}/code-mappings/recent`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserRecentActivities = async (
  userId: string,
  params?: AdminUserActivitiesQuery,
): ApiResponse<AdminActivityAuditRow[]> => {
  return businessApi
    .get<{ results: AdminActivityAuditRow[] }>(
      `/admin/users/${encodeURIComponent(userId)}/activities/recent`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserRecentUsageEvents = async (
  userId: string,
  params?: AdminUserUsageEventsQuery,
): ApiResponse<AdminUsageEventRow[]> => {
  return businessApi
    .get<{ results: AdminUsageEventRow[] }>(
      `/admin/users/${encodeURIComponent(userId)}/usage-events/recent`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserAnalysisStatusBreakdown = async (
  userId: string,
): ApiResponse<AdminAnalysisStatusCount[]> => {
  return businessApi
    .get<{ results: AdminAnalysisStatusCount[] }>(
      `/admin/users/${encodeURIComponent(userId)}/analysis/breakdown/status`,
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminUserAnalysisTriggerBreakdown = async (
  userId: string,
): ApiResponse<AdminAnalysisTriggerCount[]> => {
  return businessApi
    .get<{ results: AdminAnalysisTriggerCount[] }>(
      `/admin/users/${encodeURIComponent(userId)}/analysis/breakdown/trigger`,
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamsSearch = async (
  params?: AdminSearchQuery,
): ApiResponse<AdminTeamSearchRow[]> => {
  return businessApi
    .get<{ results: AdminTeamSearchRow[] }>("/admin/teams/search", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamGet = async (teamId: string): ApiResponse<AdminTeamDetail | null> => {
  return businessApi
    .get<AdminTeamDetail | null>(`/admin/teams/${encodeURIComponent(teamId)}`)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminTeamCreator = async (
  teamId: string,
): ApiResponse<AdminUserCreatorSummary | null> => {
  return businessApi
    .get<AdminUserCreatorSummary | null>(`/admin/teams/${encodeURIComponent(teamId)}/creator`)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminTeamMembers = async (teamId: string): ApiResponse<AdminTeamMemberRow[]> => {
  return businessApi
    .get<{ results: AdminTeamMemberRow[] }>(`/admin/teams/${encodeURIComponent(teamId)}/members`)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamInvites = async (teamId: string): ApiResponse<AdminTeamInviteRow[]> => {
  return businessApi
    .get<{ results: AdminTeamInviteRow[] }>(`/admin/teams/${encodeURIComponent(teamId)}/invites`)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamProjects = async (teamId: string): ApiResponse<AdminTeamProjectRow[]> => {
  return businessApi
    .get<{ results: AdminTeamProjectRow[] }>(`/admin/teams/${encodeURIComponent(teamId)}/projects`)
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamRecentAnalysisNodes = async (
  teamId: string,
  params?: AdminTeamAnalysisNodesQuery,
): ApiResponse<AdminAnalysisNodeAuditRow[]> => {
  return businessApi
    .get<{ results: AdminAnalysisNodeAuditRow[] }>(
      `/admin/teams/${encodeURIComponent(teamId)}/analysis-nodes/recent`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamRecentActivities = async (
  teamId: string,
  params?: AdminTeamActivitiesQuery,
): ApiResponse<AdminActivityAuditRow[]> => {
  return businessApi
    .get<{ results: AdminActivityAuditRow[] }>(
      `/admin/teams/${encodeURIComponent(teamId)}/activities/recent`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamRecentUsageEvents = async (
  teamId: string,
  params?: AdminTeamUsageEventsQuery,
): ApiResponse<AdminUsageEventRow[]> => {
  return businessApi
    .get<{ results: AdminUsageEventRow[] }>(
      `/admin/teams/${encodeURIComponent(teamId)}/usage-events/recent`,
      { params: (params ?? {}) as AdminParams },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamUsageByResource = async (
  teamId: string,
): ApiResponse<AdminUsageEventsByResource | null> => {
  return businessApi
    .get<AdminUsageEventsByResource | null>(
      `/admin/teams/${encodeURIComponent(teamId)}/usage-events/by-resource`,
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminTeamAnalysisStatusBreakdown = async (
  teamId: string,
): ApiResponse<AdminAnalysisStatusCount[]> => {
  return businessApi
    .get<{ results: AdminAnalysisStatusCount[] }>(
      `/admin/teams/${encodeURIComponent(teamId)}/analysis/breakdown/status`,
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTeamAnalysisTriggerBreakdown = async (
  teamId: string,
): ApiResponse<AdminAnalysisTriggerCount[]> => {
  return businessApi
    .get<{ results: AdminAnalysisTriggerCount[] }>(
      `/admin/teams/${encodeURIComponent(teamId)}/analysis/breakdown/trigger`,
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsSignups = async (
  params?: AdminTimeseriesSignupsQuery,
): ApiResponse<AdminSignupTimeseriesPoint[]> => {
  return businessApi
    .get<{ results: AdminSignupTimeseriesPoint[] }>("/admin/timeseries/signups", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsCodeMappings = async (
  params?: AdminTimeseriesScopeQuery,
): ApiResponse<AdminDailyCountPoint[]> => {
  return businessApi
    .get<{ results: AdminDailyCountPoint[] }>("/admin/timeseries/code-mappings", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsCodeVersions = async (
  params?: AdminTimeseriesDaysQuery,
): ApiResponse<AdminDailyCountPoint[]> => {
  return businessApi
    .get<{ results: AdminDailyCountPoint[] }>("/admin/timeseries/code-versions", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsAnalysisNodes = async (
  params?: AdminTimeseriesAnalysisNodesQuery,
): ApiResponse<AdminDailyCountPoint[]> => {
  return businessApi
    .get<{ results: AdminDailyCountPoint[] }>("/admin/timeseries/analysis-nodes", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsChatThreads = async (
  params?: AdminTimeseriesScopeQuery,
): ApiResponse<AdminDailyCountPoint[]> => {
  return businessApi
    .get<{ results: AdminDailyCountPoint[] }>("/admin/timeseries/chat-threads", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsUsageEvents = async (
  params?: AdminTimeseriesScopeQuery,
): ApiResponse<AdminDailyCountPoint[]> => {
  return businessApi
    .get<{ results: AdminDailyCountPoint[] }>("/admin/timeseries/usage-events", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsDailyActivity = async (
  params?: AdminTimeseriesScopeQuery,
): ApiResponse<AdminDailyCountPoint[]> => {
  return businessApi
    .get<{ results: AdminDailyCountPoint[] }>("/admin/timeseries/daily-activity", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminTsProjects = async (
  params?: AdminTimeseriesScopeQuery,
): ApiResponse<AdminDailyCountPoint[]> => {
  return businessApi
    .get<{ results: AdminDailyCountPoint[] }>("/admin/timeseries/projects", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminMetricCountUsers = async (
  params?: AdminMetricUsersCountQuery,
): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/users", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountUsersGithubOauth = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/users/github-oauth")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricUserSignupBounds = async (): ApiResponse<AdminUserSignupBounds | null> => {
  return businessApi
    .get<AdminUserSignupBounds | null>("/admin/metrics/users/signup-bounds")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricUsersCreatedSince = async (
  params: AdminMetricSinceQuery,
): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/users/created-since", {
      params: params as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountTeamsDeleted = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/teams/deleted")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountTeamsStripeCustomers =
  async (): ApiResponse<AdminMetricCount | null> => {
    return businessApi
      .get<AdminMetricCount | null>("/admin/metrics/count/teams/stripe-customers")
      .then((response) => {
        const requestId = response.headers["bevor-request-id"] ?? "";
        return {
          ok: true as const,
          data: response.data ?? null,
          requestId,
        };
      })
      .catch((error: unknown) => {
        if (error instanceof AxiosError && error.response?.status === 404) {
          const requestId =
            (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
          return {
            ok: true as const,
            data: null,
            requestId,
          };
        }
        return apiError(error);
      });
  };

export const adminMetricCountInvites = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/invites")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountInvitesEmail = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/invites/email")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountInvitesWallet = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/invites/wallet")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountProjectsActive = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/projects/active")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountProjectsDeleted = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/projects/deleted")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountProjectsActiveGithub =
  async (): ApiResponse<AdminMetricCount | null> => {
    return businessApi
      .get<AdminMetricCount | null>("/admin/metrics/count/projects/active-github")
      .then((response) => {
        const requestId = response.headers["bevor-request-id"] ?? "";
        return {
          ok: true as const,
          data: response.data ?? null,
          requestId,
        };
      })
      .catch((error: unknown) => {
        if (error instanceof AxiosError && error.response?.status === 404) {
          const requestId =
            (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
          return {
            ok: true as const,
            data: null,
            requestId,
          };
        }
        return apiError(error);
      });
  };

export const adminMetricCountTeamsActive = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/teams/active")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountTeamMemberRows = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/team-member-rows")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountCodeMappings = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/code-mappings")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountAnalysisNodes = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/analysis-nodes")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricCountChatThreads = async (): ApiResponse<AdminMetricCount | null> => {
  return businessApi
    .get<AdminMetricCount | null>("/admin/metrics/count/chat-threads")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricUsageEventsByResource =
  async (): ApiResponse<AdminUsageEventsByResource | null> => {
    return businessApi
      .get<AdminUsageEventsByResource | null>("/admin/metrics/usage-events/by-resource")
      .then((response) => {
        const requestId = response.headers["bevor-request-id"] ?? "";
        return {
          ok: true as const,
          data: response.data ?? null,
          requestId,
        };
      })
      .catch((error: unknown) => {
        if (error instanceof AxiosError && error.response?.status === 404) {
          const requestId =
            (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
          return {
            ok: true as const,
            data: null,
            requestId,
          };
        }
        return apiError(error);
      });
  };

export const adminMetricDistinctUsersDailyActivity = async (
  params?: AdminMetricDaysWindowQuery,
): ApiResponse<AdminDistinctDailyUsers | null> => {
  return businessApi
    .get<AdminDistinctDailyUsers | null>("/admin/metrics/daily-activity/distinct-users", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricDailyActivityRowCount = async (
  params?: AdminMetricDaysWindowQuery,
): ApiResponse<AdminDailyActivityRowCount | null> => {
  return businessApi
    .get<AdminDailyActivityRowCount | null>("/admin/metrics/daily-activity/row-count", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data ?? null,
        requestId,
      };
    })
    .catch((error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 404) {
        const requestId =
          (error.response?.headers?.["bevor-request-id"] as string | undefined) ?? "";
        return {
          ok: true as const,
          data: null,
          requestId,
        };
      }
      return apiError(error);
    });
};

export const adminMetricTeamsByPlan = async (): ApiResponse<AdminTeamPlanCountRow[]> => {
  return businessApi
    .get<{ results: AdminTeamPlanCountRow[] }>("/admin/metrics/teams/by-plan")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminMetricLargestTeams = async (
  params?: AdminMetricLargestTeamsQuery,
): ApiResponse<AdminTeamLeaderboardRow[]> => {
  return businessApi
    .get<{ results: AdminTeamLeaderboardRow[] }>("/admin/metrics/teams/largest", {
      params: (params ?? {}) as AdminParams,
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminMetricOauthByProvider = async (): ApiResponse<AdminOauthProviderCountRow[]> => {
  return businessApi
    .get<{ results: AdminOauthProviderCountRow[] }>("/admin/metrics/oauth/by-provider")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminMetricAnalysisStatusBreakdownGlobal = async (): ApiResponse<
  AdminAnalysisStatusCount[]
> => {
  return businessApi
    .get<{ results: AdminAnalysisStatusCount[] }>("/admin/metrics/analysis/breakdown/status")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};

export const adminMetricAnalysisTriggerBreakdownGlobal = async (): ApiResponse<
  AdminAnalysisTriggerCount[]
> => {
  return businessApi
    .get<{ results: AdminAnalysisTriggerCount[] }>("/admin/metrics/analysis/breakdown/trigger")
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results ?? [],
        requestId,
      };
    })
    .catch((error: unknown) => apiError(error));
};
