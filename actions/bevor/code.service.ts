"use server";

import { graphApi } from "@/lib/api";
import { ApiResponse } from "@/types/api";
import {
  CodeMappingSchema,
  GraphSnapshotFile,
  GraphSnapshotNode,
  RelationSchema,
  TreeFile,
} from "@/types/api/responses/graph";
import { Pagination } from "@/types/api/responses/shared";
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
import { QueryKey } from "@tanstack/react-query";

export const contractUploadFolder = async (
  teamSlug: string,
  projectId: string,
  data: UploadCodeFolderFormValues,
): ApiResponse<{
  id: string;
  status: "waiting" | "processing" | "success" | "failed";
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("zip", data.zip, "folder.zip");
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }

  return graphApi
    .post("/versions/folder", formData, { headers: { "bevor-team-slug": teamSlug } })
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
): ApiResponse<{
  id: string;
  status: "waiting" | "processing" | "success" | "failed";
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("files", data.file);
  formData.append("project_id", projectId);
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }

  return graphApi
    .post("/versions/file", formData, { headers: { "bevor-team-slug": teamSlug } })
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
): ApiResponse<{
  id: string;
  status: "waiting" | "processing" | "success" | "failed";
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return graphApi
    .post(
      "/versions/paste",
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
): ApiResponse<{
  id: string;
  status: "waiting" | "processing" | "success" | "failed";
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return graphApi
    .post(
      "/versions/scan",
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
): ApiResponse<{
  id: string;
  status: "waiting" | "processing" | "success" | "failed";
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return graphApi
    .post(
      "/versions/repo",
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
): ApiResponse<{
  id: string;
  status: "waiting" | "processing" | "success" | "failed";
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
  return graphApi
    .post(
      "/versions/connected-repo",
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
): ApiResponse<CodeMappingSchema> => {
  return graphApi
    .get(`/versions/${codeId}`, { headers: { "bevor-team-slug": teamSlug } })
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
): ApiResponse<{ score: number; version: CodeMappingSchema }[]> => {
  const searchParams = new URLSearchParams({ limit: "5", threshold: "0.5" });
  return graphApi
    .get(`/versions/${codeId}/similarity?${searchParams.toString()}`, {
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

export const getFiles = async (
  teamSlug: string,
  codeId: string,
): ApiResponse<GraphSnapshotFile[]> => {
  return graphApi
    .get(`/versions/${codeId}/files`, {
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

export const getFile = async (
  teamSlug: string,
  codeId: string,
  fileId: string,
): ApiResponse<GraphSnapshotFile> => {
  return graphApi
    .get(`/versions/${codeId}/files/${fileId}`, {
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

export const getFileContent = async (
  teamSlug: string,
  codeId: string,
  fileId: string,
): ApiResponse<string> => {
  return graphApi
    .get(`/versions/${codeId}/files/${fileId}/content`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.content,
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

export const getTree = async (teamSlug: string, codeId: string): ApiResponse<TreeFile[]> => {
  return graphApi
    .get(`/versions/${codeId}/tree`, { headers: { "bevor-team-slug": teamSlug } })
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
): ApiResponse<GraphSnapshotNode> => {
  return graphApi
    .get(`/versions/${codeId}/nodes/${nodeId}`, { headers: { "bevor-team-slug": teamSlug } })
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

export const getNodeContent = async (
  teamSlug: string,
  codeId: string,
  nodeId: string,
): ApiResponse<string> => {
  return graphApi
    .get(`/versions/${codeId}/nodes/${nodeId}/content`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      const requestId = response.headers["bevor-request-id"] ?? "";
      return {
        ok: true as const,
        data: response.data.content,
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
    file_id?: string;
    node_type?: string;
  },
): ApiResponse<GraphSnapshotNode[]> => {
  const searchParams = new URLSearchParams(data);
  let url = `/versions/${codeId}/nodes`;
  if (searchParams) {
    url += `?${searchParams.toString()}`;
  }

  return graphApi
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
): ApiResponse<RelationSchema> => {
  return graphApi
    .get(`/versions/${codeId}/relations`, { headers: { "bevor-team-slug": teamSlug } })
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
    [key: string]: string | undefined;
  },
): ApiResponse<Pagination<CodeMappingSchema>> => {
  const searchParams = buildSearchParams(filters);

  return graphApi
    .get(`/versions?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
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
): ApiResponse<{
  id: string;
  status: "waiting" | "processing" | "success" | "failed";
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [[QUERY_KEYS.CODES, teamSlug]];
  return graphApi
    .post(`/versions/${codeId}/retry`, {}, { headers: { "bevor-team-slug": teamSlug } })
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
  return graphApi
    .patch(
      `/versions/${codeId}`,
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
