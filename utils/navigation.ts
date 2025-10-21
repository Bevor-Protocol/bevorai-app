/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HrefProps } from "@/utils/types";

export const navigation = {
  user: {
    overview: (data: HrefProps) => "/user",
    settings: (data: HrefProps) => "/user/settings",
    notifications: (data: HrefProps) => "/user/notifications",
  },
  team: {
    overview: (data: HrefProps) => `/teams/${data.teamId}`,
    projects: (data: HrefProps) => `/teams/${data.teamId}/projects`,
    audits: (data: HrefProps) => `/teams/${data.teamId}/audits`,
    versions: (data: HrefProps) => `/teams/${data.teamId}/versions`,
    chats: (data: HrefProps) => `/teams/${data.teamId}/chats`,
    settings: {
      overview: (data: HrefProps) => `/teams/${data.teamId}/settings`,
      billing: (data: HrefProps) => `/teams/${data.teamId}/settings/billing`,
      api: (data: HrefProps) => `/teams/${data.teamId}/settings/api`,
      invoices: (data: HrefProps) => `/teams/${data.teamId}/settings/invoices`,
      members: (data: HrefProps) => `/teams/${data.teamId}/settings/members`,
    },
    // audits: (data: HrefProps) => `/teams/${data.teamId}/audits`,
    analytics: (data: HrefProps) => `/teams/${data.teamId}/analytics`,
  },
  project: {
    overview: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}`,
    audits: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/audits`,
    chats: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/chats`,
    versions: {
      overview: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/versions`,
      new: {
        overview: (data: HrefProps) =>
          `/teams/${data.teamId}/projects/${data.projectId}/versions/new`,
        address: (data: HrefProps) =>
          `/teams/${data.teamId}/projects/${data.projectId}/versions/new/address`,
        file: (data: HrefProps) =>
          `/teams/${data.teamId}/projects/${data.projectId}/versions/new/file`,
        paste: (data: HrefProps) =>
          `/teams/${data.teamId}/projects/${data.projectId}/versions/new/paste`,
        folder: (data: HrefProps) =>
          `/teams/${data.teamId}/projects/${data.projectId}/versions/new/folder`,
        repo: (data: HrefProps) =>
          `/teams/${data.teamId}/projects/${data.projectId}/versions/new/repo`,
        ide: (data: HrefProps) =>
          `/teams/${data.teamId}/projects/${data.projectId}/versions/new/ide`,
      },
    },
    settings: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/settings`,
    analytics: (data: HrefProps) => `/teams/${data.teamId}/projects/${data.projectId}/analytics`,
  },
  version: {
    overview: (data: HrefProps) =>
      `/teams/${data.teamId}/projects/${data.projectId}/versions/${data.versionId}`,
    audits: {
      overview: (data: HrefProps) =>
        `/teams/${data.teamId}/projects/${data.projectId}/versions/${data.versionId}/audits`,
      new: (data: HrefProps) =>
        `/teams/${data.teamId}/projects/${data.projectId}/versions/${data.versionId}/audits/new`,
    },
    analytics: (data: HrefProps) =>
      `/teams/${data.teamId}/projects/${data.projectId}/versions/${data.versionId}/analytics`,
  },
  audit: {
    overview: (data: HrefProps) =>
      `/teams/${data.teamId}/projects/${data.projectId}/audits/${data.auditId}`,
    scope: (data: HrefProps) =>
      `/teams/${data.teamId}/projects/${data.projectId}/audits/${data.auditId}/scope`,
    overlay: (data: HrefProps) =>
      `/teams/${data.teamId}/projects/${data.projectId}/audits/${data.auditId}/overlay`,
  },
  shared: {
    overview: (data: HrefProps) => `/shared/audits/${data.auditId}`,
    scope: (data: HrefProps) => `/shared/audits/${data.auditId}/scope`,
    overlay: (data: HrefProps) => `/shared/audits/${data.auditId}/overlay`,
  },
};
