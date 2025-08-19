/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HrefProps } from "@/utils/types";

export const navigation = {
  user: {
    overview: (data: HrefProps) => "/user",
    settings: (data: HrefProps) => "/user/settings",
  },
  team: {
    overview: (data: HrefProps) => `/teams/${data.teamSlug}`,
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
    settings: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/settings`,
    audits: (data: HrefProps) => `/teams/${data.teamSlug}/projects/${data.projectSlug}/audits`,
    analytics: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/analytics`,
  },
  version: {
    overview: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/${data.versionId}`,
    sources: (data: HrefProps) =>
      `/teams/${data.teamSlug}/projects/${data.projectSlug}/versions/${data.versionId}/sources`,
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
};
