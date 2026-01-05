"use server";

import { sharedAPI } from "@/lib/api";
import {
  ApiResponse,
  CodeSourceSchemaI,
  CodeSourceWithContentSchemaI,
  NodeSchemaI,
  NodeWithContentSchemaI,
  SharedAnalysisNodeSchemaI,
  SharedCodeMappingSchemaI,
} from "@/utils/types";

/*
All these endpoints require no authentication, and will all go through the analysisId.

The "auth" will be designated by whether the analysis is public or not.
*/

export const getAnalysis = async (nodeId: string): ApiResponse<SharedAnalysisNodeSchemaI> => {
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

export const getCode = async (nodeId: string): ApiResponse<SharedCodeMappingSchemaI> => {
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

export const getSources = async (nodeId: string): ApiResponse<CodeSourceSchemaI[]> => {
  return sharedAPI
    .get(`/shared/analyses/${nodeId}/code/sources`)
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
  analysisId: string,
  nodeId: string,
): ApiResponse<NodeWithContentSchemaI> => {
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

export const getSource = async (
  analysisId: string,
  sourceId: string,
): ApiResponse<CodeSourceWithContentSchemaI> => {
  return sharedAPI
    .get(`/shared/analyses/${analysisId}/code/sources/${sourceId}`)
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
  analysisId: string,
  data?: {
    name?: string;
    source_id?: string;
    node_type?: string;
  },
): ApiResponse<NodeSchemaI[]> => {
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
