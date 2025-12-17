"use server";

import api from "@/lib/api";
import { AnalysisNodeSchemaI, TreeResponseI } from "@/utils/types";

export const getAnalysis = async (nodeId: string): Promise<AnalysisNodeSchemaI> => {
  return api.get(`/analysis-nodes/${nodeId}`).then((response) => {
    return response.data;
  });
};

export const getScope = async (nodeId: string): Promise<TreeResponseI[]> => {
  return api.get(`/shared/analysis-nodes/${nodeId}/scope`).then((response) => {
    return response.data.results;
  });
};
