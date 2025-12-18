"use server";

import api from "@/lib/api";
import { generateQueryKey, QUERY_KEYS } from "@/utils/constants";
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
): Promise<
  CodeCreateSchemaI & {
    toInvalidate: QueryKey[];
  }
> => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("project_id", projectId);
  Object.entries(data.fileMap).forEach(([relativePath, file]) => {
    formData.append("files", file, relativePath);
  });
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
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
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("files", data.file);
  formData.append("project_id", projectId);
  if (data.parent_id) {
    formData.append("parent_id", data.parent_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
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
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
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
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_id));
  }
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

export const getCodeVersionSimilar = async (
  teamSlug: string,
  codeId: string,
): Promise<{ score: number; version: CodeMappingSchemaI }[]> => {
  return api
    .get(`/code-versions/${codeId}/similarity`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data.results;
    });
};

export const getSources = async (
  teamSlug: string,
  codeId: string,
): Promise<CodeSourceSchemaI[]> => {
  return api
    .get(`/code-versions/${codeId}/sources`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => {
      return response.data.results;
    });
};

export const getSource = async (
  teamSlug: string,
  codeId: string,
  sourceId: string,
): Promise<CodeSourceWithContentSchemaI> => {
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

export const getNode = async (
  teamSlug: string,
  codeId: string,
  nodeId: string,
): Promise<NodeWithContentSchemaI> => {
  return api
    .get(`/code-versions/${codeId}/nodes/${nodeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
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
): Promise<NodeSchemaI[]> => {
  const searchParams = new URLSearchParams(data);
  let url = `/code-versions/${codeId}/nodes`;
  if (searchParams) {
    url += `?${searchParams.toString()}`;
  }

  return api.get(url, { headers: { "bevor-team-slug": teamSlug } }).then((response) => {
    return response.data.results;
  });
};

export const getRelations = async (
  teamSlug: string,
  codeId: string,
): Promise<CodeRelationSchemaI> => {
  return api
    .get(`/code-versions/${codeId}/relations`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => {
      return response.data;
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

export const updateCodeVersionParent = async (
  teamSlug: string,
  codeId: string,
  parentId: string,
): Promise<{
  toInvalidate: QueryKey[];
}> => {
  const toInvalidate = [generateQueryKey.codeRelations(codeId)];
  return api
    .patch(
      `/code-versions/${codeId}`,
      { parent_id: parentId },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then(() => {
      return {
        toInvalidate,
      };
    });
};
