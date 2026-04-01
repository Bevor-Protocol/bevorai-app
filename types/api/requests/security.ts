import { QueryParams } from "@/types/api/requests/shared";
import {
  AnalysisNodeStatus,
  AnalysisTrigger,
  FindingStatusEnum,
} from "@/types/api/responses/security";

export interface FindingsQueryParams extends QueryParams {
  project_id?: string;
  project_slug?: string;
  user_id?: string;
  code_version_id?: string;
  analysis_id?: string;
  status?: FindingStatusEnum;
}

export interface AnalysesQueryParams extends QueryParams {
  project_id?: string;
  project_slug?: string;
  user_id?: string;
  code_version_id?: string;
  trigger?: AnalysisTrigger;
  root_node_id?: string;
  is_leaf?: boolean;
  is_root?: boolean;
  status?: AnalysisNodeStatus;
}
