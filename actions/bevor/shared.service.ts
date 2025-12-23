"use server";

import { sharedAPI } from "@/lib/api";
import {
  AnalysisNodeSchemaI,
  CodeMappingSchemaI,
  CodeSourceSchemaI,
  CodeSourceWithContentSchemaI,
  NodeSchemaI,
  NodeWithContentSchemaI,
} from "@/utils/types";

/*
All these endpoints require no authentication, and will all go through the analysisId.

The "auth" will be designated by whether the analysis is public or not.
*/

export const getAnalysis = async (nodeId: string): Promise<AnalysisNodeSchemaI> => {
  return sharedAPI
    .get(`/shared/analyses/${nodeId}?with_findings=true&with_scopes=true`)
    .then((response) => {
      return response.data;
    });
};

export const getCode = async (nodeId: string): Promise<CodeMappingSchemaI> => {
  return sharedAPI.get(`/shared/analyses/${nodeId}/code`).then((response) => {
    return response.data;
  });
};

export const getSources = async (nodeId: string): Promise<CodeSourceSchemaI[]> => {
  return sharedAPI.get(`/shared/analyses/${nodeId}/code/sources`).then((response) => {
    return response.data.results;
  });
};

export const getNode = async (
  analysisId: string,
  nodeId: string,
): Promise<NodeWithContentSchemaI> => {
  return sharedAPI.get(`/shared/analyses/${analysisId}/code/nodes/${nodeId}`).then((response) => {
    return response.data;
  });
};

export const getSource = async (
  analysisId: string,
  sourceId: string,
): Promise<CodeSourceWithContentSchemaI> => {
  return sharedAPI
    .get(`/shared/analyses/${analysisId}/code/sources/${sourceId}`)
    .then((response) => {
      return response.data;
    });
};

export const getNodes = async (
  analysisId: string,
  data?: {
    name?: string;
    source_id?: string;
    node_type?: string;
  },
): Promise<NodeSchemaI[]> => {
  const searchParams = new URLSearchParams(data);
  let url = `/shared/analyses/${analysisId}/code/nodes`;
  if (searchParams) {
    url += `?${searchParams.toString()}`;
  }

  return sharedAPI.get(url).then((response) => {
    return response.data.results;
  });
};
