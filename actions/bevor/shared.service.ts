"use server";

import api from "@/lib/api";
import { AnalysisSchemaI, TreeResponseI } from "@/utils/types";

export const getAnalysis = async (analysisId: string): Promise<AnalysisSchemaI> => {
  return api.get(`/analysis-threads/${analysisId}`).then((response) => {
    return response.data;
  });
};

export const getScope = async (analysisId: string): Promise<TreeResponseI[]> => {
  return api.get(`/shared/analysis-versions/${analysisId}/scope`).then((response) => {
    return response.data.results;
  });
};
