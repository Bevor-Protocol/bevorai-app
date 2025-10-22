"use server";

import api from "@/lib/api";
import {
  CodeVersionSchema,
  CodeVersionsResponseI,
  ContractResponseI,
  ContractSourceResponseI,
  ContractVersionSourceI,
  ContractVersionSourceTrimI,
  FunctionChunkResponseI,
  TreeResponseI,
} from "@/utils/types";

export const contractUploadFolder = async (data: {
  fileMap: Record<string, File>;
  projectId: string;
}): Promise<ContractResponseI> => {
  const formData = new FormData();
  formData.append("project_id", data.projectId);
  Object.entries(data.fileMap).forEach(([relativePath, file]) => {
    formData.append("files", file, relativePath);
  });

  return api.post("/versions/create/folder", formData).then((response) => {
    return response.data;
  });
};

export const contractUploadFile = async (data: {
  file: File;
  projectId: string;
}): Promise<ContractResponseI> => {
  const formData = new FormData();
  formData.append("files", data.file);
  formData.append("project_id", data.projectId);

  return api.post("/versions/create/file", formData).then((response) => {
    return response.data;
  });
};

export const contractUploadPaste = async (data: {
  code: string;
  projectId: string;
}): Promise<ContractResponseI> => {
  return api
    .post("/versions/create/paste", { code: data.code, project_id: data.projectId })
    .then((response) => {
      return response.data;
    });
};

export const contractUploadScan = async ({
  address,
  projectId,
}: {
  address: string;
  projectId: string;
}): Promise<ContractResponseI> => {
  return api.post("/versions/create/scan", { address, project_id: projectId }).then((response) => {
    return response.data;
  });
};

export const getContractVersion = async (versionId: string): Promise<CodeVersionSchema> => {
  return api.get(`/versions/${versionId}`).then((response) => {
    return response.data;
  });
};

export const getContractVersionSources = async (
  versionId: string,
): Promise<ContractVersionSourceTrimI[]> => {
  return api.get(`/versions/${versionId}/sources`).then((response) => {
    return response.data.results;
  });
};

export const getContractVersionSource = async (
  sourceId: string,
  versionId: string,
): Promise<ContractVersionSourceI> => {
  return api.get(`/versions/${versionId}/sources/${sourceId}`).then((response) => {
    return response.data;
  });
};

export const getContractTree = async (versionId: string): Promise<TreeResponseI[]> => {
  return api.get(`/versions/${versionId}/tree`).then((response) => {
    return response.data.results;
  });
};

export const getContractSources = async (versionId: string): Promise<ContractSourceResponseI[]> => {
  return api.get(`/contract/version/${versionId}/sources`).then((response) => {
    return response.data;
  });
};

export const getFunctionChunk = async (functionId: string): Promise<FunctionChunkResponseI> => {
  return api.get(`/contract/function/${functionId}`).then((response) => {
    return response.data;
  });
};

export const getVersions = async (filters: {
  [key: string]: string;
}): Promise<CodeVersionsResponseI> => {
  const searchParams = new URLSearchParams(filters);
  searchParams.set("page_size", filters.page_size ?? "9");

  return api.get(`/versions?${searchParams.toString()}`).then((response) => {
    return response.data;
  });
};
