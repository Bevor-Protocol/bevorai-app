"use server";

import api from "@/lib/api";
import { buildSearchParams } from "@/lib/utils";
import { QUERY_KEYS } from "@/utils/constants";
import {
  CodeSourceContentSchemaI,
  CodeSourceSchemaI,
  CodeVersionMappingSchemaI,
  CodeVersionsPaginationI,
  NodeSearchResponseI,
  TreeResponseI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const contractUploadFolder = async (
  teamSlug: string,
  projectSlug: string,
  fileMap: Record<string, File>,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  // we won't know which heads are updated. Just invalidate all analyses.
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("project_id", projectSlug);
  Object.entries(fileMap).forEach(([relativePath, file]) => {
    formData.append("files", file, relativePath);
  });

  return api
    .post("/code-versions/create/folder", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const contractUploadFile = async (
  teamSlug: string,
  projectSlug: string,
  file: File,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  // we won't know which heads are updated. Just invalidate all analyses.
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("files", file);
  formData.append("project_id", projectSlug);

  return api
    .post("/code-versions/create/file", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const contractUploadPaste = async (
  teamSlug: string,
  projectSlug: string,
  code: string,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  // we won't know which heads are updated. Just invalidate all analyses.
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  return api
    .post(
      "/code-versions/create/paste",
      { content: code, project_id: projectSlug },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const contractUploadScan = async (
  teamSlug: string,
  projectSlug: string,
  address: string,
): Promise<{
  id: string;
  toInvalidate: QueryKey[];
}> => {
  // we won't know which heads are updated. Just invalidate all analyses.
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  return api
    .post(
      "/code-versions/create/scan",
      { address, project_id: projectSlug },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return {
        id: response.data.id,
        toInvalidate,
      };
    });
};

export const getCodeVersion = async (
  teamSlug: string,
  codeId: string,
): Promise<CodeVersionMappingSchemaI> => {
  return api
    .get(`/code-versions/${codeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const getCodeVersionSources = async (
  teamSlug: string,
  codeId: string,
): Promise<CodeSourceSchemaI[]> => {
  return api
    .get(`/code-versions/${codeId}/sources`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const getCodeVersionSource = async (
  teamSlug: string,
  codeId: string,
  sourceId: string,
): Promise<CodeSourceContentSchemaI> => {
  return api
    .get(`/code-versions/${codeId}/sources/${sourceId}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data;
    });
};

export const getTree = async (teamSlug: string, codeId: string): Promise<TreeResponseI[]> => {
  return api
    .get(`/code-versions/${codeId}/tree`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const searchNodes = async (
  teamSlug: string,
  codeId: string,
  data: {
    name: string;
  },
): Promise<NodeSearchResponseI[]> => {
  return api
    .post(`/code-versions/${codeId}/search`, data, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const getVersions = async (
  teamSlug: string,
  filters: {
    [key: string]: string | undefined;
  },
): Promise<CodeVersionsPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/code-versions?${searchParams.toString()}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};
