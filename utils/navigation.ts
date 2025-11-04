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
  members: {
    overview: (data: HrefProps) => "/members",
  },
  team: {
    overview: (data: HrefProps) => `/teams/${data.teamId}`,
    projects: (data: HrefProps) => `/teams/${data.teamId}/projects`,
    analyses: (data: HrefProps) => `/teams/${data.teamId}/analyses`,
    chats: (data: HrefProps) => `/teams/${data.teamId}/chats`,
    members: (data: HrefProps) => `/teams/${data.teamId}/members`,
    settings: {
      overview: (data: HrefProps) => `/teams/${data.teamId}/settings`,
      billing: (data: HrefProps) => `/teams/${data.teamId}/settings/billing`,
      api: (data: HrefProps) => `/teams/${data.teamId}/settings/api`,
      invoices: (data: HrefProps) => `/teams/${data.teamId}/settings/invoices`,
    },
  },
  project: {
    overview: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}`,
    codes: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/codes`,
    analyses: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/analyses`,
    chats: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/chats`,
  },
  code: {
    overview: (data: HrefProps) => `/teams/${data.teamId}/codes/${data.versionId}`,
    new: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/codes/new`,
  },
  analysis: {
    overview: (data: HrefProps) => `/teams/${data.teamId}/analyses/${data.analysisId}`,
  },
  shared: {
    overview: (data: HrefProps) => `/shared/analyses/${data.analysisId}`,
  },
};
