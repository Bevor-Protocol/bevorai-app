/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HrefProps } from "@/utils/types";

export const navigation = {
  user: {
    settings: (data: HrefProps) => "/user/profile",
    notifications: (data: HrefProps) => "/user/notifications",
  },
  teams: {
    overview: (data: HrefProps) => "/teams",
  },
  projects: {
    overview: (data: HrefProps) => "/projects",
  },
  team: {
    overview: (data: HrefProps) => `/teams/${data.teamSlug}`,
    projects: (data: HrefProps) => `/teams/${data.teamSlug}/projects`,
    analyses: (data: HrefProps) => `/teams/${data.teamSlug}/analyses`,
    chats: (data: HrefProps) => `/teams/${data.teamSlug}/chats`,
    settings: {
      overview: (data: HrefProps) => `/teams/${data.teamSlug}/settings`,
      billing: (data: HrefProps) => `/teams/${data.teamSlug}/settings/billing`,
      api: (data: HrefProps) => `/teams/${data.teamSlug}/settings/api`,
      invoices: (data: HrefProps) => `/teams/${data.teamSlug}/settings/invoices`,
      plans: (data: HrefProps) => `/teams/${data.teamSlug}/settings/plans`,
      members: (data: HrefProps) => `/teams/${data.teamSlug}/settings/members`,
    },
  },
  project: {
    overview: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}`,
    codes: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/codes`,
    analyses: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/analyses`,
    chats: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/chats`,
  },
  code: {
    overview: (data: HrefProps) => `/teams/${data.teamSlug}/codes/${data.codeId}`,
    new: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/codes/new`,
  },
  analysis: {
    overview: (data: HrefProps) => `/teams/${data.teamSlug}/analyses/${data.analysisId}`,
  },
  analysisVersions: {
    overview: (data: HrefProps) =>
      `/teams/${data.teamSlug}/analysis-versions/${data.analysisVersionId}`,
  },
  shared: {
    overview: (data: HrefProps) => `/shared/analyses/${data.analysisId}`,
  },
};
