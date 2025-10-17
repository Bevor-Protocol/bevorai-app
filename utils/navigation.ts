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
    overview: (data: HrefProps) => `/teams/${data.teamSlug}`,
    projects: (data: HrefProps) => `/teams/${data.teamSlug}/projects`,
    audits: (data: HrefProps) => `/teams/${data.teamSlug}/audits`,
    versions: (data: HrefProps) => `/teams/${data.teamSlug}/versions`,
    chats: (data: HrefProps) => `/teams/${data.teamSlug}/chats`,
    settings: {
      overview: (data: HrefProps) => `/teams/${data.teamSlug}/settings`,
      billing: (data: HrefProps) => `/teams/${data.teamSlug}/settings/billing`,
      api: (data: HrefProps) => `/teams/${data.teamSlug}/settings/api`,
      invoices: (data: HrefProps) => `/teams/${data.teamSlug}/settings/invoices`,
      members: (data: HrefProps) => `/teams/${data.teamSlug}/settings/members`,
    },
    // audits: (data: HrefProps) => `/teams/${data.teamSlug}/audits`,
    analytics: (data: HrefProps) => `/teams/${data.teamSlug}/analytics`,
  },
  project: {
    overview: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}`,
    audits: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/audits`,
    chats: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/chats`,
    versions: {
      overview: (data: HrefProps) =>
        `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions`,
      new: {
        overview: (data: HrefProps) =>
          `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/new`,
        address: (data: HrefProps) =>
          `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/new/address`,
        file: (data: HrefProps) =>
          `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/new/file`,
        paste: (data: HrefProps) =>
          `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/new/paste`,
        folder: (data: HrefProps) =>
          `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/new/folder`,
        repo: (data: HrefProps) =>
          `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/new/repo`,
        ide: (data: HrefProps) =>
          `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/new/ide`,
      },
    },
    settings: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/settings`,
    analytics: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/analytics`,
  },
  version: {
    overview: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/${data.versionId}`,
    audits: {
      overview: (data: HrefProps) =>
        `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/${data.versionId}/audits`,
      new: (data: HrefProps) =>
        `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/${data.versionId}/audits/new`,
    },
    analytics: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/${data.versionId}/analytics`,
  },
  audit: {
    overview: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/audits/${data.auditId}`,
    scope: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/audits/${data.auditId}/scope`,
    overlay: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/audits/${data.auditId}/overlay`,
  },
  shared: {
    overview: (data: HrefProps) => `/shared/audits/${data.auditId}`,
    scope: (data: HrefProps) => `/shared/audits/${data.auditId}/scope`,
    overlay: (data: HrefProps) => `/shared/audits/${data.auditId}/overlay`,
  },
};
