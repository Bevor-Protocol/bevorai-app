"use server";

import api from "@/lib/api";
import { BreadcrumbSchemaI } from "@/utils/types";

export const getTeamBreadcrumb = async (teamId: string): Promise<BreadcrumbSchemaI> => {
  return api.get("/breadcrumbs/team", { headers: { "bevor-team-id": teamId } }).then((response) => {
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
    .get(`/breadcrumbs/projects/${projectId}/security-analyses`, {
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

export const getSecurityAnalysisBreadcrumb = async (
  teamId: string,
  securityAnalysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/security-analyses/${securityAnalysisId}`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getSecurityAnalysisVersionsBreadcrumb = async (
  teamId: string,
  securityAnalysisId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/security-analyses/${securityAnalysisId}/security-versions`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getSecurityAnalysisVersionBreadcrumb = async (
  teamId: string,
  securityAnalysisVersionId: string,
): Promise<BreadcrumbSchemaI> => {
  return api
    .get(`/breadcrumbs/security-versions/${securityAnalysisVersionId}`, {
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
