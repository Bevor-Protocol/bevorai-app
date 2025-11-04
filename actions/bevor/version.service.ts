"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import {
  CodeSourceContentSchemaI,
  CodeSourceSchemaI,
  CodeVersionMappingSchemaI,
  CodeVersionsPaginationI,
  ContractSourceResponseI,
  FunctionChunkResponseI,
  TreeResponseI,
} from "@/utils/types";

export const contractUploadFolder = async (
  teamId: string,
  projectId: string,
  fileMap: Record<string, File>,
): Promise<string> => {
  const formData = new FormData();
  formData.append("project_id", projectId);
  Object.entries(fileMap).forEach(([relativePath, file]) => {
    formData.append("files", file, relativePath);
  });

  return api
    .post("/code-versions/create/folder", formData, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};

export const contractUploadFile = async (
  teamId: string,
  projectId: string,
  file: File,
): Promise<string> => {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("project_id", projectId);

  return api
    .post("/code-versions/create/file", formData, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.id;
    });
};

export const contractUploadPaste = async (
  teamId: string,
  projectId: string,
  code: string,
): Promise<string> => {
  return api
    .post(
      "/code-versions/create/paste",
      { code, project_id: projectId },
      { headers: { "bevor-team-id": teamId } },
    )
    .then((response) => {
      return response.data.id;
    });
};

export const contractUploadScan = async (
  teamId: string,
  projectId: string,
  address: string,
): Promise<string> => {
  return api
    .post(
      "/code-versions/create/scan",
      { address, project_id: projectId },
      { headers: { "bevor-team-id": teamId } },
    )
    .then((response) => {
      return response.data.id;
    });
};

export const getCodeVersion = async (
  teamId: string,
  versionId: string,
): Promise<CodeVersionMappingSchemaI> => {
  return api
    .get(`/code-versions/${versionId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getCodeVersionSources = async (
  teamId: string,
  versionId: string,
): Promise<CodeSourceSchemaI[]> => {
  return api
    .get(`/code-versions/${versionId}/sources`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.results;
    });
};

export const getCodeVersionSource = async (
  teamId: string,
  versionId: string,
  sourceId: string,
): Promise<CodeSourceContentSchemaI> => {
  return api
    .get(`/code-versions/${versionId}/sources/${sourceId}`, {
      headers: { "bevor-team-id": teamId },
    })
    .then((response) => {
      return response.data;
    });
};

export const getTree = async (teamId: string, versionId: string): Promise<TreeResponseI[]> => {
  return api
    .get(`/code-versions/${versionId}/tree`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data.results;
    });
};

export const getCodeSources = async (
  teamId: string,
  versionId: string,
): Promise<ContractSourceResponseI[]> => {
  return api
    .get(`/contract/version/${versionId}/sources`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getFunctionChunk = async (
  teamId: string,
  functionId: string,
): Promise<FunctionChunkResponseI> => {
  return api
    .get(`/contract/function/${functionId}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};

export const getVersions = async (
  teamId: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<CodeVersionsPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/code-versions?${searchParams.toString()}`, { headers: { "bevor-team-id": teamId } })
    .then((response) => {
      return response.data;
    });
};
