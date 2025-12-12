"use server";

import api from "@/lib/api";
import { AnalysisThreadSchemaI, TreeResponseI } from "@/utils/types";

export const getAnalysis = async (threadId: string): Promise<AnalysisThreadSchemaI> => {
  return api.get(`/analysis-threads/${threadId}`).then((response) => {
    return response.data;
  });
};

export const getScope = async (threadId: string): Promise<TreeResponseI[]> => {
  return api.get(`/shared/analysis-versions/${threadId}/scope`).then((response) => {
    return response.data.results;
  });
};
