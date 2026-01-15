"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
import { buildSearchParams } from "@/utils/query-params";
import {
  CreateCodeFromGithubFormValues,
  CreateCodeFromPublicGithubFormValues,
  PasteCodeFileFormValues,
  ScanCodeAddressFormValues,
  UploadCodeFileFormValues,
  UploadCodeFolderFormValues,
} from "@/utils/schema";
import {
  ApiResponse,
  CodeCreateSchemaI,
  CodeMappingSchemaI,
  CodeRelationSchemaI,
  CodeSourceSchemaI,
  CodeSourceWithContentSchemaI,
  CodeVersionsPaginationI,
  NodeSchemaI,
  NodeWithContentSchemaI,
  TreeResponseI,
} from "@/utils/types";
import { QueryKey } from "@tanstack/react-query";

export const contractUploadFolder = async (
  teamSlug: string,
  projectId: string,
  data: UploadCodeFolderFormValues,
): ApiResponse<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("zip", data.zip, "folder.zip");
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }

  return api
    .post("/codes/create/folder", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { ...response.data, toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const contractUploadFile = async (
  teamSlug: string,
  projectId: string,
  data: UploadCodeFileFormValues,
): ApiResponse<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("files", data.file);
  formData.append("project_id", projectId);
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }

  return api
    .post("/codes/create/file", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { ...response.data, toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const contractUploadPaste = async (
  teamSlug: string,
  projectId: string,
  data: PasteCodeFileFormValues,
): ApiResponse<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return api
    .post(
      "/codes/create/paste",
      { project_id: projectId, ...data },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { ...response.data, toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const contractUploadScan = async (
  teamSlug: string,
  projectId: string,
  data: ScanCodeAddressFormValues,
): ApiResponse<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return api
    .post(
      "/codes/create/scan",
      { address: data.address, project_id: projectId, parent_id: data.parent_id },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { ...response.data, toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const contractUploadPublicRepo = async (
  teamSlug: string,
  projectId: string,
  data: CreateCodeFromPublicGithubFormValues,
): ApiResponse<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return api
    .post(
      "/codes/create/repo",
      { url: data.url, project_id: projectId, parent_id: data.parent_id },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { ...response.data, toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const createCodeConnectedGithub = async (
  teamSlug: string,
  projectId: string,
  data: CreateCodeFromGithubFormValues,
): ApiResponse<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return api
    .post(
      "/codes/create/connected-repo",
      {
        project_id: projectId,
        branch: data.branch,
        commit_sha: data.commit,
        parent_id: data.parent_id,
      },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { ...response.data, toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getCodeVersion = async (
  teamSlug: string,
  codeId: string,
): ApiResponse<CodeMappingSchemaI> => {
  return api
    .get(`/codes/${codeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getCodeVersionSimilar = async (
  teamSlug: string,
  codeId: string,
): ApiResponse<{ score: number; version: CodeMappingSchemaI }[]> => {
  const searchParams = new URLSearchParams({ limit: "5", threshold: "0.5" });
  return api
    .get(`/codes/${codeId}/similarity?${searchParams.toString()}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getSources = async (
  teamSlug: string,
  codeId: string,
): ApiResponse<CodeSourceSchemaI[]> => {
  return api
    .get(`/codes/${codeId}/sources`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getSource = async (
  teamSlug: string,
  codeId: string,
  sourceId: string,
): ApiResponse<CodeSourceWithContentSchemaI> => {
  return api
    .get(`/codes/${codeId}/sources/${sourceId}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getTree = async (teamSlug: string, codeId: string): ApiResponse<TreeResponseI[]> => {
  return api
    .get(`/codes/${codeId}/tree`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getNode = async (
  teamSlug: string,
  codeId: string,
  nodeId: string,
): ApiResponse<NodeWithContentSchemaI> => {
  return api
    .get(`/codes/${codeId}/nodes/${nodeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getNodes = async (
  teamSlug: string,
  codeId: string,
  data?: {
    name?: string;
    source_id?: string;
    node_type?: string;
  },
): ApiResponse<NodeSchemaI[]> => {
  const searchParams = new URLSearchParams(data);
  let url = `/codes/${codeId}/nodes`;
  if (searchParams) {
    url += `?${searchParams.toString()}`;
  }

  return api
    .get(url, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.results,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getRelations = async (
  teamSlug: string,
  codeId: string,
): ApiResponse<CodeRelationSchemaI> => {
  return api
    .get(`/codes/${codeId}/relations`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const getVersions = async (
  teamSlug: string,
  filters: {
    [key: string]: string;
  },
): ApiResponse<CodeVersionsPaginationI> => {
  const searchParams = buildSearchParams(filters);

  return api
    .get(`/codes?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data,
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const retryEmbedding = async (
  teamSlug: string,
  codeId: string,
): ApiResponse<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate = [[QUERY_KEYS.CODES, teamSlug]];
  return api
    .post(`/codes/${codeId}/retry`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { ...response.data, toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};

export const updateCodeVersionParent = async (
  teamSlug: string,
  codeId: string,
  parentId: string,
): ApiResponse<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [generateQueryKey.codeRelations(codeId)];
  return api
    .patch(
      `/codes/${codeId}`,
      { parent_id: parentId },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: { toInvalidate },
        requestId,
      };
    })
    .catch((error: any) => {
      const requestId = error.response?.headers?.["bevor-request-id"] ?? "";
      return {
        ok: false as const,
        error: error.response?.data ?? { message: error.message },
        requestId,
      };
    });
};
