"use server";

import { apiRequest, withRequestId } from "@/actions/base";
import { graphApi } from "@/lib/api";
import {
  CodeMappingSchema,
  CreateCodeResponse,
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

export const contractUploadFolder = apiRequest<
  [teamSlug: string, projectId: string, data: UploadCodeFolderFormValues],
  CreateCodeResponse & {
    toInvalidate: QueryKey[];
  }
>(async (teamSlug, projectId, data) => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("zip", data.zip, "folder.zip");
  formData.append("analyze", "true");
  if (data.parent_code_version_id) {
    formData.append("parent_id", data.parent_code_version_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_code_version_id));
  }

  return graphApi
    .post("/versions/folder", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) =>
      withRequestId(response, {
        ...response.data,
        toInvalidate,
      }),
    );
});

export const contractUploadFile = apiRequest<
  [teamSlug: string, projectId: string, data: UploadCodeFileFormValues],
  CreateCodeResponse & {
    toInvalidate: QueryKey[];
  }
>(async (teamSlug, projectId, data) => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];

  const formData = new FormData();
  formData.append("files", data.file);
  formData.append("project_id", projectId);
  formData.append("analyze", "true");
  if (data.parent_code_version_id) {
    formData.append("parent_id", data.parent_code_version_id);
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_code_version_id));
  }

  return graphApi
    .post("/versions/file", formData, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) =>
      withRequestId(response, {
        ...response.data,
        toInvalidate,
      }),
    );
});

export const contractUploadPaste = apiRequest<
  [teamSlug: string, projectId: string, data: PasteCodeFileFormValues],
  CreateCodeResponse & {
    toInvalidate: QueryKey[];
  }
>(async (teamSlug, projectId, data) => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_code_version_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_code_version_id));
  }
  return graphApi
    .post(
      "/versions/paste",
      { project_id: projectId, analyze: true, ...data },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) =>
      withRequestId(response, {
        ...response.data,
        toInvalidate,
      }),
    );
});

export const contractUploadScan = apiRequest<
  [teamSlug: string, projectId: string, data: ScanCodeAddressFormValues],
  CreateCodeResponse & {
    toInvalidate: QueryKey[];
  }
>(async (teamSlug, projectId, data) => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_code_version_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_code_version_id));
  }
  return graphApi
    .post(
      "/versions/scan",
      { project_id: projectId, analyze: true, ...data },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) =>
      withRequestId(response, {
        ...response.data,
        toInvalidate,
      }),
    );
});

export const contractUploadPublicRepo = apiRequest<
  [teamSlug: string, projectId: string, data: CreateCodeFromPublicGithubFormValues],
  CreateCodeResponse & {
    toInvalidate: QueryKey[];
  }
>(async (teamSlug, projectId, data) => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_code_version_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_code_version_id));
  }
  return graphApi
    .post(
      "/versions/repo",
      { project_id: projectId, analyze: true, ...data },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) =>
      withRequestId(response, {
        ...response.data,
        toInvalidate,
      }),
    );
});

export const createCodeConnectedGithub = apiRequest<
  [teamSlug: string, projectId: string, data: CreateCodeFromGithubFormValues],
  CreateCodeResponse & {
    toInvalidate: QueryKey[];
  }
>(async (teamSlug, projectId, data) => {
  const toInvalidate: QueryKey[] = [[QUERY_KEYS.ANALYSES], [QUERY_KEYS.CODES, teamSlug]];
  if (data.parent_code_version_id) {
    toInvalidate.push(generateQueryKey.codeRelations(data.parent_code_version_id));
  }
  return graphApi
    .post(
      "/versions/connected-repo",
      {
        project_id: projectId,
        analyze: true,
        ...data,
      },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) =>
      withRequestId(response, {
        ...response.data,
        toInvalidate,
      }),
    );
});

export const getCodeVersion = apiRequest<[teamSlug: string, codeId: string], CodeMappingSchema>(
  async (teamSlug, codeId) =>
    graphApi
      .get(`/versions/${codeId}`, { headers: { "bevor-team-slug": teamSlug } })
      .then((response) => withRequestId(response, response.data)),
);

export const getCodeVersionSimilar = apiRequest<
  [teamSlug: string, codeId: string],
  { score: number; version: CodeMappingSchema }[]
>(async (teamSlug, codeId) => {
  const searchParams = new URLSearchParams({ limit: "5", threshold: "0.5" });
  return graphApi
    .get(`/versions/${codeId}/similarity?${searchParams.toString()}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data.results));
});

export const getFiles = apiRequest<[teamSlug: string, codeId: string], GraphSnapshotFile[]>(
  async (teamSlug, codeId) =>
    graphApi
      .get(`/versions/${codeId}/files`, {
        headers: { "bevor-team-slug": teamSlug },
      })
      .then((response) => withRequestId(response, response.data.results)),
);

export const getFile = apiRequest<
  [teamSlug: string, codeId: string, fileId: string],
  GraphSnapshotFile
>(async (teamSlug, codeId, fileId) =>
  graphApi
    .get(`/versions/${codeId}/files/${fileId}`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data)),
);

export const getFileContent = apiRequest<
  [teamSlug: string, codeId: string, fileId: string],
  string
>(async (teamSlug, codeId, fileId) =>
  graphApi
    .get(`/versions/${codeId}/files/${fileId}/content`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data.content)),
);

export const getTree = apiRequest<[teamSlug: string, codeId: string], TreeFile[]>(
  async (teamSlug, codeId) =>
    graphApi
      .get(`/versions/${codeId}/tree`, { headers: { "bevor-team-slug": teamSlug } })
      .then((response) => withRequestId(response, response.data.results)),
);

export const getNode = apiRequest<
  [teamSlug: string, codeId: string, nodeId: string],
  GraphSnapshotNode
>(async (teamSlug, codeId, nodeId) =>
  graphApi
    .get(`/versions/${codeId}/nodes/${nodeId}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, response.data)),
);

export const getNodeContent = apiRequest<
  [teamSlug: string, codeId: string, nodeId: string],
  string
>(async (teamSlug, codeId, nodeId) =>
  graphApi
    .get(`/versions/${codeId}/nodes/${nodeId}/content`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data.content)),
);

export const getScopesForNode = apiRequest<
  [teamSlug: string, codeId: string, nodeId: string],
  string[]
>(async (teamSlug, codeId, nodeId) =>
  graphApi
    .get(`/versions/${codeId}/nodes/${nodeId}/scopes-for-node`, {
      headers: { "bevor-team-slug": teamSlug },
    })
    .then((response) => withRequestId(response, response.data.results)),
);

export const getNodes = apiRequest<
  [
    teamSlug: string,
    codeId: string,
    data?: {
      name?: string;
      file_id?: string;
      node_type?: string;
    },
  ],
  GraphSnapshotNode[]
>(async (teamSlug, codeId, data) => {
  const searchParams = new URLSearchParams(data);
  let url = `/versions/${codeId}/nodes`;
  if (searchParams) {
    url += `?${searchParams.toString()}`;
  }

  return graphApi
    .get(url, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, response.data.results));
});

export const getRelations = apiRequest<[teamSlug: string, codeId: string], RelationSchema>(
  async (teamSlug, codeId) =>
    graphApi
      .get(`/versions/${codeId}/relations`, { headers: { "bevor-team-slug": teamSlug } })
      .then((response) => withRequestId(response, response.data)),
);

export const getVersions = apiRequest<
  [teamSlug: string, filters: { [key: string]: string }],
  Pagination<CodeMappingSchema>
>(async (teamSlug, filters) => {
  const searchParams = buildSearchParams(filters);

  return graphApi
    .get(`/versions?${searchParams}`, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) => withRequestId(response, response.data));
});

export const retryEmbedding = apiRequest<
  [teamSlug: string, codeId: string],
  CreateCodeResponse & {
    toInvalidate: QueryKey[];
  }
>(async (teamSlug, codeId) => {
  const toInvalidate = [[QUERY_KEYS.CODES, teamSlug]];
  return graphApi
    .post(`/versions/${codeId}/retry`, {}, { headers: { "bevor-team-slug": teamSlug } })
    .then((response) =>
      withRequestId(response, {
        ...response.data,
        toInvalidate,
      }),
    );
});

export const updateCodeVersionParent = apiRequest<
  [teamSlug: string, codeId: string, parentId: string],
  { toInvalidate: QueryKey[] }
>(async (teamSlug, codeId, parentId) => {
  const toInvalidate = [generateQueryKey.codeRelations(codeId)];
  return graphApi
    .patch(
      `/versions/${codeId}`,
      { parent_id: parentId },
      { headers: { "bevor-team-slug": teamSlug } },
    )
    .then((response) => withRequestId(response, { toInvalidate }));
});
