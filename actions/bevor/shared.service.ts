"use server";

import { sharedAPI } from "@/lib/api";
import { ApiResponse } from "@/types/api";

/*
All these endpoints require no authentication, and will all go through the analysisId.

The "auth" will be designated by whether the analysis is public or not.
*/

export const getAnalysis = async (nodeId: string): ApiResponse<any> => {
  return sharedAPI
    .get(`/shared/analyses/${nodeId}?with_findings=true&with_scopes=true`)
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

export const getCode = async (nodeId: string): ApiResponse<any> => {
  return sharedAPI
    .get(`/shared/analyses/${nodeId}/code`)
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

export const getFiles = async (nodeId: string): ApiResponse<any[]> => {
  return sharedAPI
    .get(`/shared/analyses/${nodeId}/code/files`)
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

export const getNode = async (analysisId: string, nodeId: string): ApiResponse<any> => {
  return sharedAPI
    .get(`/shared/analyses/${analysisId}/code/nodes/${nodeId}`)
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

export const getFile = async (analysisId: string, fileId: string): ApiResponse<any> => {
  return sharedAPI
    .get(`/shared/analyses/${analysisId}/code/files/${fileId}`)
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

export const getFileContent = async (analysisId: string, fileId: string): ApiResponse<string> => {
  return sharedAPI
    .get(`/shared/analyses/${analysisId}/code/files/${fileId}/content`)
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
  analysisId: string,
  data?: {
    name?: string;
    file_id?: string;
    node_type?: string;
  },
): ApiResponse<any[]> => {
  const searchParams = new URLSearchParams(data);
  let url = `/shared/analyses/${analysisId}/code/nodes`;
  if (searchParams) {
    url += `?${searchParams.toString()}`;
  }

  return sharedAPI
    .get(url)
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
