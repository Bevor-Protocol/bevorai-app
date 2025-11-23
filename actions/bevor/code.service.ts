"use server";

import api from "@/lib/api";
import { QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import {
  PasteCodeFileFormValues,
  ScanCodeAddressFormValues,
  UploadCodeFileFormValues,
  UploadCodeFolderFormValues,
} from "@/utils/schema";
import {
  CodeCreateSchemaI,
  CodeMappingSchemaI,
  CodeSourceContentSchemaI,
  CodeVersionsPaginationI,
  NodeSearchResponseI,
  TreeResponseI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const contractUploadFolder = async (
  teamSlug: string,
  projectId: string,
  data: UploadCodeFolderFormValues,
): Promise<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("project_id", projectId);
  Object.entries(data.fileMap).forEach(([relativePath, file]) => {
    formData.append("files", file, relativePath);
  });
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
  }

  return api
    .post("/code-versions/create/folder", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        ...response.data,
        toInvalidate,
      };
    });
};

export const contractUploadFile = async (
  teamSlug: string,
  projectId: string,
  data: UploadCodeFileFormValues,
): Promise<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("files", data.file);
  formData.append("project_id", projectId);
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
  }

  return api
    .post("/code-versions/create/file", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        ...response.data,
        toInvalidate,
      };
    });
};

export const contractUploadPaste = async (
  teamSlug: string,
  projectId: string,
  data: PasteCodeFileFormValues,
): Promise<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  return api
    .post(
      "/code-versions/create/paste",
      { project_id: projectId, ...data },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return {
        ...response.data,
        toInvalidate,
      };
    });
};

export const contractUploadScan = async (
  teamSlug: string,
  projectId: string,
  data: ScanCodeAddressFormValues,
): Promise<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  return api
    .post(
      "/code-versions/create/scan",
      { address: data.address, project_id: projectId, parent_id: data.parent_id },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      return {
        ...response.data,
        toInvalidate,
      };
    });
};

export const getCodeVersion = async (
  teamSlug: string,
  codeId: string,
): Promise<CodeMappingSchemaI> => {
  return api
    .get(`/code-versions/${codeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
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
    [key: string]: string;
  },
): Promise<CodeVersionsPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/code-versions?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
    });
};

export const retryEmbedding = async (
  teamSlug: string,
  codeId: string,
): Promise<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate = [[QUERY_KEYS.CODES, teamSlug]];
  return api
    .post(`/code-versions/${codeId}/retry`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return {
        ...response.data,
        toInvalidate,
      };
    });
};
