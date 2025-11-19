"use server";

import api from "@/lib/api";
import { BreadcrumbSchemaI } from "@/utils/types";

export const getTeamBreadcrumb = async (teamSlug: string): Promise<BreadcrumbSchemaI> => {
  return api
    .get("/breadcrumbs/team", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getTeamSettingsBreadcrumb = async (teamSlug: string): Promise<BreadcrumbSchemaI> => {
  return api
    .get("/breadcrumbs/team/settings", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getProjectsBreadcrumb = async (teamSlug: string): Promise<BreadcrumbSchemaI> => {
  return api
    .get("/breadcrumbs/projects", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysesBreadcrumb = async (teamSlug: string): Promise<BreadcrumbSchemaI> => {
  return api
    .get("/breadcrumbs/analyses", { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getProjectBreadcrumb = async (
  teamSlug: string,
  projectSlug: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectSlug}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getProjectNewCodeBreadcrumb = async (
  teamSlug: string,
  projectSlug: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectSlug}/code-versions/new`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getProjectCodesBreadcrumb = async (
  teamSlug: string,
  projectSlug: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectSlug}/code-versions`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getProjectAnalysesBreadcrumb = async (
  teamSlug: string,
  projectSlug: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectSlug}/analyses`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getProjectChatsBreadcrumb = async (
  teamSlug: string,
  projectSlug: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectSlug}/chats`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getCodeVersionBreadcrumb = async (
  teamSlug: string,
  codeVersionId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/code-versions/${codeVersionId}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisBreadcrumb = async (
  teamSlug: string,
  analysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analyses/${analysisId}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersionsBreadcrumb = async (
  teamSlug: string,
  analysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analyses/${analysisId}/analysis-versions`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersionBreadcrumb = async (
  teamSlug: string,
  analysisVersionId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analysis-versions/${analysisVersionId}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisNewVersionBreadcrumb = async (
  teamSlug: string,
  analysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analyses/${analysisId}/analysis-versions/new`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisChatBreadcrumb = async (
  teamSlug: string,
  analysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analyses/${analysisId}/chat`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getChatBreadcrumb = async (
  teamSlug: string,
  chatId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/chats/${chatId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};
