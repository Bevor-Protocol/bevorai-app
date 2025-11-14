"use server";

import api from "@/lib/api";
import { BreadcrumbSchemaI } from "@/utils/types";

export const getTeamBreadcrumb = async (teamId: string): Promise<BreadcrumbSchemaI> => {
  return api.get("/breadcrumbs/team", { headers: { "bevor-team-id": teamId } }).then((response) => {
    return response.data;
  });
};

export const getTeamSettingsBreadcrumb = async (teamId: string): Promise<BreadcrumbSchemaI> => {
  return api
    .get("/breadcrumbs/team/settings", { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getProjectsBreadcrumb = async (teamId: string): Promise<BreadcrumbSchemaI> => {
  return api
    .get("/breadcrumbs/projects", { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysesBreadcrumb = async (teamId: string): Promise<BreadcrumbSchemaI> => {
  return api
    .get("/breadcrumbs/analyses", { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getProjectBreadcrumb = async (
  teamId: string,
  projectId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getProjectNewCodeBreadcrumb = async (
  teamId: string,
  projectId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectId}/code-versions/new`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getProjectCodesBreadcrumb = async (
  teamId: string,
  projectId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectId}/code-versions`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getProjectAnalysesBreadcrumb = async (
  teamId: string,
  projectId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectId}/analyses`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getProjectChatsBreadcrumb = async (
  teamId: string,
  projectId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/projects/${projectId}/chats`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getCodeVersionBreadcrumb = async (
  teamId: string,
  codeVersionId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/code-versions/${codeVersionId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisBreadcrumb = async (
  teamId: string,
  analysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analyses/${analysisId}`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersionsBreadcrumb = async (
  teamId: string,
  analysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analyses/${analysisId}/analysis-versions`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisVersionBreadcrumb = async (
  teamId: string,
  analysisVersionId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analysis-versions/${analysisVersionId}`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getAnalysisChatBreadcrumb = async (
  teamId: string,
  analysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/analyses/${analysisId}/chat`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getChatBreadcrumb = async (
  teamId: string,
  chatId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/chats/${chatId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};
